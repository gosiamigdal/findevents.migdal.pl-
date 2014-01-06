$(function () {
    var config = {
        googleApiKey: "AIzaSyDrKH9w5_wCjizggLncPp215z1OmCEHlFU",
        googleClientId: "552663294103-925qfrkdt8bfnqe80q4st9pssi0t0g01.apps.googleusercontent.com",
        googleScope: "https://www.googleapis.com/auth/calendar.readonly",
        eventbriteApiKey: "FCD3JWTG53R3SD3FFC"
    };

    $("#find-events").click(function (event) {
        console.log("Finding events");
        $(this).addClass("active");
        gapi.client.setApiKey(config.googleApiKey);
        gapi.auth.authorize(
            {client_id: config.googleClientId, scope: config.googleScope},
            findCalendarIds
        );
    });

    var findCalendarIds = function () {
        console.log("Authorized access to Google calendar")
        gapi.client.request({
            path: "calendar/v3/users/me/calendarList",
            callback: findFreeSpots
        });
    };

    var findFreeSpots = function (data) {
        console.log("Got calendar ids");
        // TODO: Ask user which calendar to use
        var primaryId = "";
        for (var i = 0 ; i < data.items.length ; i++) {
            var item = data.items[i];
            if (item.primary == true) {
                primaryId = item.id;
            };
        };
        console.log("Id of primary calendar: " + primaryId);
        var now = new Date();
        var weekLater = new Date();
        weekLater.setDate(now.getDate() + 7);
        $("#event-left").empty();
        $("#event-right").empty();
        gapi.client.request({
            path: "calendar/v3/freeBusy",
            method: "POST",
            body: {
                timeMin: now.toISOString(),
                timeMax: weekLater.toISOString(),
                items: [{id: primaryId}]
            },
            callback: findEventsFirst
        });
    };

    var findEventsFirst = function(calendarData) {
        findEvents(calendarData, 1, 0);
    }

    var findEvents = function (calendarData, pageNum, added) {
        console.log("Find events for free spots.");
        var now = new Date();
        var weekLater = new Date();
        weekLater.setDate(now.getDate() + 7);
        var perPage = 25;
        $.ajax({
            type: "GET",
            url: "https://developer.eventbrite.com/json/event_search",
            dataType: "jsonp",
            data: {
                app_key: config.eventbriteApiKey,
                city: $("#city").val(),
                within: $("#miles").val(),
                display: "repeat_schedule",
                max: perPage,
                page: pageNum,
                date: (now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " "
                 + weekLater.getFullYear() + "-" + (weekLater.getMonth() + 1) + "-" + weekLater.getDate())
            },
            success: function (eventData) {
                console.log("Events found");
                fixEventDate(eventData, now, weekLater);
                added = displayEvents(calendarData, eventData, added);
                if (eventData.contents.events[0].summary.total_items > pageNum * perPage) {
                    findEvents(calendarData, pageNum + 1, added);
                } else {
                    $("#events-sum").html("Found " + added + " events.");
                    $("#find-events").removeClass("active");
                }
            }
        });
    };

    var fixEventDate = function (eventData, startDate, endDate) {
        // Eventbrite API return start_date of first event if recurring, not the current one!
        var events = eventData.contents.events;
        for (var i = 0; i < events.length ; i++) {
            var item = events[i];
            if (item.event != undefined) {
                var eventStartDate = new Date(item.event.start_date);
                if (eventStartDate < startDate || endDate < eventStartDate) {
                    if (item.event.repeat_schedule == undefined) {
                        console.log("Start date doesn't match but event is not repeating!")
                        console.log(item.event);
                        events.splice(i, 1);
                        i--;
                    } else {
                        // fix date
                        for (var j = 0; j < item.event.repeat_schedule.length; j++) {
                            var schedule = item.event.repeat_schedule[j];
                            var date = new Date(schedule.start_date);
                            var fixed = false;
                            if (startDate < date && date < endDate) {
                                item.event.start_date = schedule.start_date;
                                item.event.end_date = schedule.end_date;
                                fixed = true;
                                break;
                            } 
                        }

                        if (!fixed) {
                            console.log("Can't fix date for repeated event:")
                            console.log(item.event);
                            events.splice(i, 1);
                            i--; 
                        }
                    }
                }
            }
        } 
    }

    var displayEvents = function (calendarData, eventData, added) {
        console.log("Events displaying");
        var events = eventData.contents.events;
        for (var i = 0 ; i < events.length ; i++) {
            var item = events[i];
            if (item.event != undefined) {
                if (isEventInFreeTime(calendarData, item.event)) {
                    var startDate = new Date(item.event.start_date);
                    var date = startDate.toDateString();
                    var time = startDate.toLocaleTimeString();
                    var url = item.event.url;
                    var text = "<h4>" + "<a class='event-link' href=" + url + ">" + item.event.title + "</a>" + "</h4>" + "<h3>" + "Category: " + item.event.category + "</h3>" +
                    "<p>" + "Where? " + item.event.venue.address + ", " + item.event.venue.city + "</p>" +  
                    "<p>" + "When? " + date + ", " + time + "</p>" + "<br>";
                    if (added % 2 == 0) {
                        $("#event-left").append(text);
                    } else {
                        $("#event-right").append(text);
                    }
                    added += 1;
                }
            }
        }
        $('a.event-link').click(function() {
            $(this).attr('target', '_blank');
        });
        return added;
    };

    var calendarToBusyPairs = function (calendarData) {
        var busy = [];
        for (var key in calendarData.calendars) {
            var calendar = calendarData.calendars[key];
            for (var i = 0; i < calendar.busy.length; i++) {
                var range = calendar.busy[i];
                busy.push([new Date(range.start), new Date(range.end)]);
            }
        }
        return busy;
    }

    var isEventInFreeTime = function (calendarData, event) {
        var busy = calendarToBusyPairs(calendarData);
        var eventStart = new Date(event.start_date);
        var eventEnd = new Date(event.end_date);
        for (var i = 0; i < busy.length; i++) {
            var start = busy[i][0];
            var end = busy[i][1];
            if (!(end < eventStart || eventEnd < start)) {
                //console.log("Collision: " + start + " " + end + " with " + eventStart + " " + eventEnd);
                return false; 
            } 
        } 
        return true;
    }
});



