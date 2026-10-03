import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Pressable } from 'react-native';
import { CalendarProvider, WeekCalendar, Calendar } from 'react-native-calendars';
import BasicDay from 'react-native-calendars/src/calendar/day/basic';
import Svg, { Path } from 'react-native-svg';
import { CalendarDays } from 'lucide-react-native';
import { useThemeColors } from '../constants/config';
import PopupBubble from './PopupBubble';
import { toLocalDateString } from '../utils/date';

// Default day cell that also reports its on-screen position on long press,
// so the context menu can open directly below the pressed day.
// While that menu is open (marking.menuOpen), the day stays highlighted as if held down.
// Today (marking.isToday) gets a blue ring around the day.
// First days of period (marking.periodStart) get a blood-drop background instead of a circle;
// if that day is also the selected day, the drop sits inside the selected day's circle.
function MeasuredDay(props) {
  const themeColors = useThemeColors();
  const ref = useRef(null);
  const { date, marking, onLongPress } = props;

  const handleLongPress = (dateData) => {
    if (!ref.current) return onLongPress?.(dateData);
    // measure() (not measureInWindow) gives screen-root coordinates; on Android measureInWindow
    // omits the status bar height, which placed the menu over the day instead of below it
    ref.current.measure((_x, _y, width, height, pageX, pageY) => {
      onLongPress?.({ ...dateData, layout: { x: pageX, y: pageY, width, height } });
    });
  };

  return (
    <View ref={ref} collapsable={false}>
      {marking?.menuOpen && <View pointerEvents="none" style={[dayHighlightStyles.fill, { backgroundColor: themeColors.popupPressed }]} />}
      {marking?.periodStart && marking.dayIsSelected && (
        <View pointerEvents="none" style={[dayHighlightStyles.circle, { backgroundColor: themeColors.primary }]} />
      )}
      {marking?.periodStart && (
        <BloodDrop size={marking.dayIsSelected ? DROP_SIZE_IN_CIRCLE : DROP_SIZE} color={themeColors.danger} />
      )}
      <BasicDay {...props} date={date?.dateString} onLongPress={handleLongPress} />
      {(marking?.menuOpen || marking?.isToday) && <View pointerEvents="none" style={[dayHighlightStyles.ring, { borderColor: themeColors.primary }]} />}
    </View>
  );
}

const CALENDAR_PADDING = 10;

// The day cell from react-native-calendars is a fixed 32x32
const DAY_CELL_SIZE = 32;
const DROP_SIZE = 32;
const DROP_SIZE_IN_CIRCLE = 26;
// Teardrop in a 24x24 box: tip at the top, wide round bulb centered at (12, 14) with radius 9.5
const DROP_PATH = 'M12 0.5C12 0.5 2.5 8 2.5 14a9.5 9.5 0 0 0 19 0C21.5 8 12 0.5 12 0.5Z';
const DROP_BOTTOM_Y = 23.5 / 24;

// Positioned so the bottom of the drop touches the bottom of the day's (real or imaginary) circle
function BloodDrop({ size, color }) {
  const top = DAY_CELL_SIZE - size * DROP_BOTTOM_Y;
  const left = (DAY_CELL_SIZE - size) / 2;
  return (
    <Svg pointerEvents="none" width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', top, left }}>
      <Path d={DROP_PATH} fill={color} />
    </Svg>
  );
}

const dayHighlightStyles = StyleSheet.create({
  circle: { position: 'absolute', top: 0, left: 0, width: DAY_CELL_SIZE, height: DAY_CELL_SIZE, borderRadius: DAY_CELL_SIZE / 2 },
  fill: { position: 'absolute', top: -2, bottom: -2, left: -2, right: -2, borderRadius: 999 },
  ring: { position: 'absolute', top: -4, bottom: -4, left: -4, right: -4, borderRadius: 999, borderWidth: 2 },
});

export default function CalendarSection({ selectedDate, onDateChange, periodStarts = [], onTogglePeriodStart }) {
  const themeColors = useThemeColors();
  const [isMonthlyView, setIsMonthlyView] = useState(true);
  const [dayMenu, setDayMenu] = useState(null); // { dateString, layout } while the long-press menu is open
  // WeekCalendar pages default to the full screen width, wider than this card, which pushed
  // the last day of each week off the right edge. Each page must match the card's inner width.
  const [weekWidth, setWeekWidth] = useState(null);

  // Long-press opens a one-line menu under the pressed day; tapping anywhere else dismisses it
  const handleDayLongPress = ({ dateString, layout }) => setDayMenu({ dateString, layout });
  const closeDayMenu = () => setDayMenu(null);

  const menuIsClear = dayMenu && periodStarts.includes(dayMenu.dateString);

  const markedDates = { [selectedDate]: { selected: true, selectedColor: themeColors.primary } };
  // The drop (and the selected circle under it) is drawn by MeasuredDay; the library's own circle is
  // made transparent and only used to turn the number white
  periodStarts.forEach((date) => {
    markedDates[date] = { periodStart: true, dayIsSelected: date === selectedDate, selected: true, selectedColor: 'transparent', selectedTextColor: '#ffffff' };
  });
  // Ringed by MeasuredDay, so today stays recognizable even under a drop or the selection circle
  const today = toLocalDateString();
  markedDates[today] = { ...markedDates[today], isToday: true };
  if (dayMenu) markedDates[dayMenu.dateString] = { ...markedDates[dayMenu.dateString], menuOpen: true };

  const calendarTheme = { calendarBackground: themeColors.card, dayTextColor: themeColors.title, textDisabledColor: themeColors.muted, monthTextColor: themeColors.title, todayTextColor: themeColors.primary, arrowColor: themeColors.primary };

  const styles = StyleSheet.create({
    sectionWrapper: { marginVertical: 10 },
    // No shadows here: a shadow on either piece draws a line across the seam between card and tab
    calendarWrapper: { backgroundColor: themeColors.card, borderRadius: 12, borderBottomRightRadius: 0, padding: CALENDAR_PADDING, minHeight: 110 },
    // Full size but invisible and out of the layout: the week list throws if it has zero size
    hiddenWeek: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 },
    toggleTab: { alignSelf: 'flex-end', minWidth: 52, paddingHorizontal: 10, height: 44, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: themeColors.card },
    // Concave corner joining the card's bottom edge to the tab's left side
    tabFillet: { position: 'absolute', top: 0, left: -12, width: 12, height: 12, backgroundColor: themeColors.card },
    tabFilletMask: { flex: 1, backgroundColor: themeColors.background, borderTopRightRadius: 12 },
    toggleCalendarBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    weekIconText: { fontSize: 9, lineHeight: 10, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center', color: themeColors.primary },
    dayMenuItem: { paddingVertical: 12, paddingHorizontal: 18 },
    dayMenuItemPressed: { backgroundColor: themeColors.popupPressed },
    dayMenuText: { fontSize: 15, fontWeight: '500', textAlign: 'center', color: themeColors.title },
    dayMenuTextClear: { color: themeColors.danger }
  });

  return (
    <TouchableWithoutFeedback onPress={(e) => e?.stopPropagation?.()}>
      <View style={styles.sectionWrapper}>
      <View
        style={styles.calendarWrapper}
        onLayout={(e) => setWeekWidth(e.nativeEvent.layout.width - CALENDAR_PADDING * 2)}
      >
        <CalendarProvider date={selectedDate} onDateChanged={onDateChange}>
          {isMonthlyView && (
            <Calendar
              current={selectedDate}
              markedDates={markedDates}
              // Unlike WeekCalendar, the month grid doesn't report presses through CalendarProvider
              onDayPress={(day) => onDateChange(day.dateString)}
              onDayLongPress={handleDayLongPress}
              dayComponent={MeasuredDay}
              theme={calendarTheme}
            />
          )}
          {/* Stays mounted (hidden) behind the month grid: it has to lay out and measure itself before
              drawing, which took over half a second on every switch. It follows date changes through
              CalendarProvider. */}
          {weekWidth !== null && (
            <View
              style={isMonthlyView && styles.hiddenWeek}
              pointerEvents={isMonthlyView ? 'none' : 'auto'}
              importantForAccessibility={isMonthlyView ? 'no-hide-descendants' : 'auto'}
              accessibilityElementsHidden={isMonthlyView}
            >
              <WeekCalendar
                calendarWidth={weekWidth}
                current={selectedDate}
                markedDates={markedDates}
                onDayLongPress={handleDayLongPress}
                dayComponent={MeasuredDay}
                theme={calendarTheme}
              />
            </View>
          )}
        </CalendarProvider>
      </View>

        <View style={styles.toggleTab}>
          <View style={styles.tabFillet}>
            <View style={styles.tabFilletMask} />
          </View>

          {/* Shows the view it switches to: month grid while weekly, WEEKLY while monthly */}
          <TouchableOpacity
            style={styles.toggleCalendarBtn}
            onPress={() => setIsMonthlyView(!isMonthlyView)}
            accessibilityLabel={isMonthlyView ? "Switch to weekly view" : "Switch to monthly view"}
          >
            {isMonthlyView
              ? (
                <Text style={styles.weekIconText} numberOfLines={1}>WEEKLY</Text>
              )
              : <CalendarDays size={22} color={themeColors.primary} />}
          </TouchableOpacity>
        </View>

        <PopupBubble visible={!!dayMenu} anchor={dayMenu?.layout} onDismiss={closeDayMenu}>
          {dayMenu && (
            <Pressable
              style={({ pressed }) => [styles.dayMenuItem, pressed && styles.dayMenuItemPressed]}
              onPress={() => {
                onTogglePeriodStart(dayMenu.dateString);
                closeDayMenu();
              }}>
              <Text style={[styles.dayMenuText, menuIsClear && styles.dayMenuTextClear]}>
                {menuIsClear ? 'Clear first day of period' : 'Mark as first day of period'}
              </Text>
            </Pressable>
          )}
        </PopupBubble>
      </View>
    </TouchableWithoutFeedback>
  );
}
