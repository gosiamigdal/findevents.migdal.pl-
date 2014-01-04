$(function () {
    var config = {
        googleApiKey: "AIzaSyDrKH9w5_wCjizggLncPp215z1OmCEHlFU",
        googleClientId: "552663294103-925qfrkdt8bfnqe80q4st9pssi0t0g01.apps.googleusercontent.com",
        googleScope: "https://www.googleapis.com/auth/calendar.readonly"
    };

    var findCalendarIds = function () {
        console.log("Authorized access to Google calendar")
        gapi.client.request({
            path: "calendar/v3/users/me/calendarList",
            callback: findFreeSpots
        });
    };

    var findFreeSpots = function (data) {
        console.log("Got calendar ids");
        var primaryId = "";
        for (var i = 0 ; i < data.items.length ; i++) {
            var item = data.items[i];
            if (item.primary == true) {
                primaryId = item.id;
            };
        };
        console.log("Id of primary calendar: " + primaryId);
        gapi.client.request({
            path: "calendar/v3/freeBusy",
            method: "POST",
            body: {
                timeMin: "2014-01-03T10:00:00Z",
                timeMax: "2014-01-10T10:00:00Z",
                items: [{id: primaryId}]
            },
            callback: findEvents
        });
    };

    var findEvents = function (data) {
        console.log("Find events for free spots.");
    };

    $("#find-events").click(function (event) {
        console.log("Finding events");
        gapi.client.setApiKey(config.googleApiKey);
        gapi.auth.authorize(
            {client_id: config.googleClientId, scope: config.googleScope},
            findCalendarIds
        );
    });
});



