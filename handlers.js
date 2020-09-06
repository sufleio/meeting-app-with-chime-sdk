const AWS = require("aws-sdk");

const chime = new AWS.Chime();
const { v4: uuidv4 } = require("uuid");

// Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

const json = (statusCode, contentType, body) => {
    return {
        statusCode,
        headers: { "content-type": contentType },
        body: JSON.stringify(body),
    };
};

exports.join = async (event, context, callback) => {
    console.log("here");
    const query = event.queryStringParameters;
    let meetingId = null;
    let meeting = null;
    if (!query.meetingId) {
        //new meeting
        meetingId = uuidv4();
        meeting = await chime
            .createMeeting({
                ClientRequestToken: meetingId,
                MediaRegion: "eu-west-1",
                ExternalMeetingId: meetingId,
            })
            .promise();
    } else {
        //join to old meeting
        meetingId = query.meetingId;
        meeting = await chime
            .getMeeting({
                MeetingId: meetingId,
            })
            .promise();
    }

    //We've initialized our meeting! Now let's add attendees.
    const attendee = await chime
        .createAttendee({
            //ID of the meeting
            MeetingId: meeting.Meeting.MeetingId,

            //User ID that we want to associate to
            ExternalUserId: `${uuidv4().substring(0, 8)}#${query.clientId}`,
        })
        .promise();

    return json(200, "application/json", {
        Info: {
            Meeting: meeting,
            Attendee: attendee,
        },
    });
};

exports.end = async (event, context) => {
    const body = JSON.parse(event.body);
    console.log(body.meetingId);
    const deleteRequest = await chime.deleteMeeting({
        MeetingId: body.meetingId
    }).promise();
    return json(200, "application/json", {});
};

const StaticFileHandler = require('serverless-aws-static-file-handler')

exports.index = async (event, context, callback) => {
    const clientFilesPath = __dirname + "/html/";
    const fileHandler = new StaticFileHandler(clientFilesPath)
    return await fileHandler.get(event,context);
}