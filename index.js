// Lambda function to write to SQS async with all
// ami's in specified region

var queue_url = "https://sqs.us-east-1.amazonaws.com/124775650587/crawled_amis"
var region = "us-east-1"

var AWS = require("aws-sdk");
var sqs = new AWS.SQS({region: region});

AWS.config.update({region:region});
AWS.config.getCredentials(function(err) {
    if (err) console.log(err.stack);
    // credentials not loaded
    else {
      console.log("Access key:", AWS.config.credentials.accessKeyId);
      console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
    }
  });

var currtime = Date.now();
console.log(currtime);

var describeImages = function describe_images(region) {
    var params = {};

    var ec2 = new AWS.EC2({region: region});

    return ec2.describeImages(params).promise();

}

function sendSqsMessage(data, queue_url) {
    var params = {
        MessageBody: data,
        QueueUrl: queue_url
    }

    return sqs.sendMessage(params);
    
    // let sendSqsMessage = sqs.sendMessage(params).promise();

    // return sendSqsMessage.then((data) => {
    //     console.log(`OrdersSvc | SUCCESS: ${data.MessageId}`);
    // }).catch((err) => {
    //     console.log(`OrdersSvc | ERROR: ${err}`);
    // }); 
}
  

exports.handler = async function (event, context) {
    console.log("Got Event:" + JSON.stringify(event))
    var queue_url = event.queue_url;
    var region = event.region;

    // console.log(images)

    var images = await describeImages(region);

    // console.log(images)

    (async function loop() {
        for (let i of images.Images) {
            i.CrawledTime = currtime
            i.Region = region
            let sendSqsMessagePromise = sendSqsMessage(JSON.stringify(i), queue_url).promise();
            sendSqsMessagePromise.then((data) => {
                console.log(`SUCCESS: ${i.ImageId}`);
            }).catch((err) => {
                console.log(`ERROR: ${err}`);
            });
        }
    })();

}

var event = {"queue_url": queue_url, "region": region}
var context = "test"
exports.handler(event, context);
