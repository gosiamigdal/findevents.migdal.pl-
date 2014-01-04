$(function () {
    var config = {
        googleApiKey: "AIzaSyDrKH9w5_wCjizggLncPp215z1OmCEHlFU",
        googleClientId: "552663294103-925qfrkdt8bfnqe80q4st9pssi0t0g01.apps.googleusercontent.com",
        googleScope: "https://www.googleapis.com/auth/calendar.readonly",
        eventbriteApiKey: "FCD3JWTG53R3SD3FFC"
    };

    $("#find-events").click(function (event) {
        console.log("Finding events");
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
        gapi.client.request({
            path: "calendar/v3/freeBusy",
            method: "POST",
            body: {
                timeMin: now.toISOString(),
                timeMax: weekLater.toISOString(),
                items: [{id: primaryId}]
            },
            callback: findEvents
        });
    };

    var findEvents = function (data) {
        console.log("Find events for free spots.");
        $.ajax({
            type: "GET",
            url: "https://developer.eventbrite.com/json/event_search",
            dataType: "jsonp",
            data: {
                app_key: config.eventbriteApiKey//,
                //max: 100,
                //date: "Next week"
            },
            success: function (msg) {
                console.log("Events found");
            }
        });
    };


});



