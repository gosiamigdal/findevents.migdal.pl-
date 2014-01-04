$(function () {
    var config = {
        googleApiKey: "AIzaSyDrKH9w5_wCjizggLncPp215z1OmCEHlFU",
        googleClientId: "552663294103-925qfrkdt8bfnqe80q4st9pssi0t0g01.apps.googleusercontent.com",
        googleScope: "https://www.googleapis.com/auth/calendar.readonly"
    };

    $("#find-events").click(function (event) {
        console.log("Finding events");
        gapi.client.setApiKey(config.googleApiKey);
        gapi.auth.authorize(
            {client_id: config.googleClientId, scope: config.googleScope},
            function () {
                console.log("authorized access to Google calendar")
            }
        );
    });
});




