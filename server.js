/*
 Author : Kartik Panchal
 Desription : Paytm transaction token generation
 */

// required dependency
var express = require('express');
var checkSumLib = require('./Paytm/checksum');
var https = require('https');

// instance of express
var app = new express();

// allowing to use json and url encoded
app.use(express.json());
app.use(express.urlencoded());


// defining port
var port = process.env.PORT || 7000;

// simple get request
app.get("/", function (req, res) {
    res.send("Welcome to Mr.Bucks Services !");
});

// creating request for token generation
app.post("/genTransactionToken", (req, res) => {

    // creating payload for sending request to paytm
    var paytmPayload = {};

    // required fields to pass in body of request
    var mid = req.body.mid;
    var keySecret = req.body.keySecret;

    var requestType = "Payment";
    var orderId = req.body.orderId;
    var callbackUrl = req.body.callbackUrl;
    var websiteName = req.body.websiteName;
    var txnAmount = req.body.txnAmount;
    var email = req.body.email;
    var custId = req.body.custId;

    //creating paytmPayload body object
    paytmPayload.body = {
        "requestType": requestType,
        "mid": mid,
        "orderId": orderId,
        "callbackUrl": callbackUrl,
        "websiteName": websiteName,
        "txnAmount": {
            "value": txnAmount,
            "currency": "INR"
        },
        "userInfo": {
            "custId": custId,
            "email": email
        }
    }

    console.log(JSON.stringify(paytmPayload.body));

    checkSumLib.genchecksumbystring(JSON.stringify(paytmPayload.body), keySecret, function (err, checkSum) {

        if (!err) {

            paytmPayload.head = {
                "signature": checkSum
            }

            var postData = JSON.stringify(paytmPayload);

            // for production use 'securegw.paytm.in'
            var options = {
                hostname: 'securegw-stage.paytm.in',
                port: 443,
                path: '/theia/api/v1/initiateTransaction?mid=' + mid + '&orderId=' + orderId,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                }
            }

            //making https request to paytm transaction api
            var response = "";
            var reqResponse = https.request(options, (reqResponse)=>{
                reqResponse.on('data', (chunk) => {
                    response += chunk;
                });

                reqResponse.on('end', ()=>{
                    response = JSON.parse(response);
                    console.log("Response : ", response);
                    
                    // sending response to requester
                    res.send(response.body.txnToken);
                    return 0;
                });
            });


            // posting data
            console.log("*** Paytm https request Response ***");
            reqResponse.write(postData);
            reqResponse.end();

        } else {
            return;
        }
    });

});



// starting server
app.listen(port, function () {
    console.log("Server Started ...");
});