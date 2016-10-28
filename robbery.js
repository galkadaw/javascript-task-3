'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var DAYS_OF_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var timePeriodsOfDays = [
        [
            {
                from: parseTime(workingHours.from),
                to: parseTime(workingHours.to),
                countOfPeople: 0
            }
        ],
        [
            {
                from: parseTime(workingHours.from),
                to: parseTime(workingHours.to),
                countOfPeople: 0
            }
        ],
        [
            {
                from: parseTime(workingHours.from),
                to: parseTime(workingHours.to),
                countOfPeople: 0
            }
        ]
    ];


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (checkBadParams(schedule, duration, workingHours)) {
                return false;
            }
            if (!convertDataToFreePeriods(schedule, timePeriodsOfDays, workingHours)) {
                return false;
            }
            for (var i = 0; i < timePeriodsOfDays.length; i++) {
                if (foundCorrectPeriod(timePeriodsOfDays[i], duration)) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (checkBadParams(schedule, duration, workingHours)) {
                return '';
            }
            if (!convertDataToFreePeriods(schedule, timePeriodsOfDays, workingHours)) {
                return '';
            }
            for (var i = 0; i < timePeriodsOfDays.length; i++) {
                timePeriodsOfDays[i].sort(sortPeriods);
                template = createTemplate(template, timePeriodsOfDays[i], duration, i);
                if (template.indexOf('%') === -1) {
                    return template;
                }
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {

            return false;
        }
    };

};

function checkBadParams(schedule, duration, workingHours) {
    return checkSchedule(schedule) || checkDuration(duration) || checkWorkingHours(workingHours);
}

function checkSchedule(schedule) {
    return (schedule === null || schedule === undefined);
}

function checkDuration(duration) {
    return (duration === undefined || Number.isNaN(duration) || duration < 0);
}

function checkWorkingHours(workingHours) {
    return (workingHours === undefined || workingHours === null ||
        Object.keys(workingHours).indexOf('from') === -1 ||
        Object.keys(workingHours).indexOf('to') === -1 ||
        checkBankTimeStrings(workingHours));

}

function checkBankTimeStrings(workingHours) {
    var isNotCorrectString = false;
    for (var index in workingHours) {
        if (workingHours.hasOwnProperty(index)) {
            isNotCorrectString = isNotCorrectString ||
                workingHours[index].search(/^\d{2}:\d{2}\+\d\d?/) === -1 ||
                workingHours[index].length < 7 || workingHours[index].length > 8;
        }
    }

    return isNotCorrectString;
}

function convertDataToFreePeriods(schedule, timePeriodsOfDays, workingHours) {
    var parsedSchedule = {
        Danny: [],
        Rusty: [],
        Linus: []
    };
    if (!convertTimePeriods(schedule, parsedSchedule, workingHours)) {
        return false;
    }
    var freeTimeSchedule = {
        Danny: [],
        Rusty: [],
        Linus: []
    };
    inverseTimePeriods(parsedSchedule, freeTimeSchedule);
    segmentsIntersection(freeTimeSchedule, timePeriodsOfDays);

    return true;
}

function convertTimePeriods(schedule, parsedSchedule, workingHours) {
    var bankGMT = getBankGMT(workingHours);
    for (var ind in schedule) {
        if (!schedule.hasOwnProperty(ind) ||
            !parseOnePersonPeriods(schedule[ind], parsedSchedule[ind], bankGMT)) {
            return false;
        }
    }

    return true;
}

function getBankGMT(workingHours) {
    var bankWorkGMT = 0;
    if (workingHours.from.length > 5) {
        bankWorkGMT = parseInt(workingHours.from.substr(6));
    }

    return bankWorkGMT;
}

function parseOnePersonPeriods(person, parsedSchedulePerson, bankGMT) {
    for (var j = 0; j < person.length; j++) {
        var tryParseDataFrom = parseDataSchedule(person[j].from, bankGMT);
        var tryParseDataTo = parseDataSchedule(person[j].to, bankGMT);
        if (tryParseDataFrom.day > -1 && tryParseDataTo.day > -1) {
            addNewParsedPeriod(parsedSchedulePerson, tryParseDataFrom, tryParseDataTo);
        } else {
            return false;
        }
    }

    return true;
}

function parseDataSchedule(item, gmtBank) {
    var dayTime = {
        day: -1,
        time: 0
    };
    if (item.search(/^[А-Я]{2}\s\d{2}:\d{2}\+\d\d?$/) === -1 || item.length < 10 ||
    item.length > 11) {
        return dayTime;
    }
    dayTime.day = DAYS_OF_WEEK.indexOf(item.substr(0, 2));
    if (dayTime.day !== -1) {
        dayTime.time = parseTime(item.substr(3, 5));
        var gmtDate = parseInt(item.substr(9));
        setGTMBank(dayTime, gmtBank - gmtDate);
    }

    return dayTime;
}


function parseTime(time) {
    return parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
}

function setGTMBank(timeFree, gmtBankMove) {
    timeFree.time = (timeFree.time + gmtBankMove * 60) % 1440;
    if (timeFree.time < 0) {
        timeFree.time += 1439;
        if (timeFree.day === 0) {
            timeFree.day = 6;
        } else {
            timeFree.day --;
        }
    }
    if (Math.floor(timeFree.time / 1440) > 0) {
        if (timeFree.day === 6) {
            timeFree.day = 0;
        } else {
            timeFree.day ++;
        }
    }
}

function addNewParsedPeriod(parsedSchedulePerson, tryParseDataFrom, tryParseDataTo) {
    parsedSchedulePerson.push(
        {
            from: {
                day: -1,
                time: 0
            },
            to: {
                day: -1,
                time: 0
            }
        }
    );
    if (tryParseDataFrom.day === tryParseDataTo.day) {
        assignment(tryParseDataFrom,
            parsedSchedulePerson[parsedSchedulePerson.length - 1].from);
        assignment(tryParseDataTo,
            parsedSchedulePerson[parsedSchedulePerson.length - 1].to);
    } else {
        assignment(tryParseDataFrom,
            parsedSchedulePerson[parsedSchedulePerson.length - 1].from);
        parsedSchedulePerson[parsedSchedulePerson.length - 1].to.day =
            tryParseDataFrom.day;
        parsedSchedulePerson[parsedSchedulePerson.length - 1].to.time =
            1439;
        parsedSchedulePerson.push(
            {
                from: {
                    day: -1,
                    time: 0
                },
                to: {
                    day: -1,
                    time: 0
                }
            }
        );
        parsedSchedulePerson[parsedSchedulePerson.length - 1].from.day =
            tryParseDataTo.day;
        parsedSchedulePerson[parsedSchedulePerson.length - 1].from.time =
            0;
        assignment(tryParseDataTo,
            parsedSchedulePerson[parsedSchedulePerson.length - 1].to);
    }

}

function assignment(assignFrom, assignTo) {
    assignTo.day = assignFrom.day;
    assignTo.time = assignFrom.time;
}

function inverseTimePeriods(parsedSchedule, freeTimeSchedule) {
    for (var index in parsedSchedule) {
        if (parsedSchedule.hasOwnProperty(index)) {
            var listOfPeriodEnds = [[], [], []];
            createListOfPeriodEnds(parsedSchedule[index], listOfPeriodEnds);
            listOfPeriodEnds.forEach(removeOrAddDayEnds);
            createFreeTimePeriods(index, listOfPeriodEnds, freeTimeSchedule);
        }
    }

}

function createListOfPeriodEnds(item, listOfEnds) {
    for (var j = 0; j < item.length; j++) {
        var day = item[j].from.day;
        if (day >= 0 && day <= 2) {
            listOfEnds[day].push(item[j].from.time);
            listOfEnds[day].push(item[j].to.time);
        }
    }
}

function removeOrAddDayEnds(index) {
    if (index.indexOf(0) > -1) {
        index.splice(index.indexOf(0), 1);
    } else {
        index.push(0);
    }
    if (index.indexOf(1439) > -1) {
        index.splice(index.indexOf(1439), 1);
    } else {
        index.push(1439);
    }
    index.sort(compareNumbers);
}

function compareNumbers(a, b) {
    if (a > b) {
        return 1;
    }
    if (b > a) {
        return -1;
    }
}

function createFreeTimePeriods(index, listOfPeriods, freeTimeSchedule) {
    for (var k = 0; k < listOfPeriods.length; k++) {
        for (var l = 0; l < listOfPeriods[k].length; l += 2) {
            freeTimeSchedule[index].push(
                {
                    from: 0,
                    to: 0,
                    day: -1
                }
            );
            var lastElement = freeTimeSchedule[index].length - 1;
            freeTimeSchedule[index][lastElement].day = k;
            freeTimeSchedule[index][lastElement].from = listOfPeriods[k][l];
            freeTimeSchedule[index][lastElement].to = listOfPeriods[k][l + 1];
        }
    }
}

function segmentsIntersection(freeTime, timePeriodsOfDays) {
    var countOfCycle = 0;
    for (var person in freeTime) {
        if (freeTime.hasOwnProperty(person)) {
            countOfCycle =
                createActualFreePeriods(freeTime[person], countOfCycle, timePeriodsOfDays);
        }
    }

}

function createActualFreePeriods(freeTime, countOfCycle, timePeriodsOfDays) {
    for (var l = 0; l < freeTime.length; l++) {
        createNewPeriod(freeTime[l], timePeriodsOfDays, countOfCycle);
    }
    countOfCycle ++;
    clearWrongPeriods(timePeriodsOfDays, countOfCycle);

    return countOfCycle;
}

function createNewPeriod(freeTimePeriod, timePeriodsOfDays, countOfCycle) {
    var dayOfSchedule = freeTimePeriod.day;
    for (var m = 0; m < timePeriodsOfDays[dayOfSchedule].length; m++) {
        if ((freeTimePeriod.from > timePeriodsOfDays[dayOfSchedule][m].from &&
                freeTimePeriod.from < timePeriodsOfDays[dayOfSchedule][m].to ||
                freeTimePeriod.to < timePeriodsOfDays[dayOfSchedule][m].to &&
                freeTimePeriod.to > timePeriodsOfDays[dayOfSchedule][m].from
            ) && timePeriodsOfDays[dayOfSchedule][m].countOfPeople === countOfCycle) {
            timePeriodsOfDays[dayOfSchedule].push(
                {
                    from: 0,
                    to: 0,
                    countOfPeople: 0
                }
            );
            var lastElement = timePeriodsOfDays[dayOfSchedule].length - 1;
            timePeriodsOfDays[dayOfSchedule][lastElement].from =
                Math.max(freeTimePeriod.from,
                    timePeriodsOfDays[dayOfSchedule][m].from);
            timePeriodsOfDays[dayOfSchedule][lastElement].to =
                Math.min(freeTimePeriod.to,
                    timePeriodsOfDays[dayOfSchedule][m].to);
            timePeriodsOfDays[dayOfSchedule][lastElement].countOfPeople =
                countOfCycle + 1;
        }
        if (freeTimePeriod.from <= timePeriodsOfDays[dayOfSchedule][m].from &&
            freeTimePeriod.to >= timePeriodsOfDays[dayOfSchedule][m].to) {
            timePeriodsOfDays[dayOfSchedule][m].countOfPeople = countOfCycle + 1;
        }
    }
}

function clearWrongPeriods(timePeriods, countOfCycle) {
    for (var o = 0; o < timePeriods.length; o++) {
        deleteWrongPeriods(timePeriods[o], countOfCycle);
    }
}

function deleteWrongPeriods(timePeriods, countOfCycle) {
    var n = 0;
    while (n < timePeriods.length) {
        if (timePeriods[n].countOfPeople < countOfCycle) {
            timePeriods.splice(n, 1);
        } else {
            n++;
        }
    }
}

function foundCorrectPeriod(timePeriodsOfDays, duration) {
    for (var j = 0; j < timePeriodsOfDays.length; j++) {
        if (timePeriodsOfDays[j].to - timePeriodsOfDays[j].from >= duration) {
            return true;
        }
    }

    return false;
}


function sortPeriods(period1, period2) {
    if (period1.from > period2.from) {
        return 1;
    }
    if (period1.from < period2.from) {
        return -1;
    }
}

function createTemplate(template, timePeriodsOfDay, duration, dayOfWeek) {
    for (var j = 0; j < timePeriodsOfDay.length; j++) {
        if (timePeriodsOfDay[j].to - timePeriodsOfDay[j].from >= duration) {
            template = template.replace('%DD', DAYS_OF_WEEK[dayOfWeek]);
            template = template.replace('%HH',
                reportNumberToString(Math.floor(timePeriodsOfDay[j].from / 60)));
            template = template.replace('%MM',
                reportNumberToString(timePeriodsOfDay[j].from % 60));

            return template;
        }
    }

    return template;
}

function reportNumberToString(number) {
    if (number < 10) {
        return '0' + number;
    }

    return number;
}
