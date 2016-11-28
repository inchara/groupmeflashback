
var accessToken = "initial";
var threshFavoriteImages = 30;
var threshFavoriteText = 30;
var maxPullNumMsgs = 100;
var numMessages = 0;
var groupmeBatch ;
var allMessages=" ";

// Following are needed to get the slideshow ready
var popMin=0;
var popMax=0;
var groupId="";
var startDate="";

// Parse URL with access code and return the access code.

function checkForParam(url, keyNeeded) {
	var queryStart = url.indexOf("?") + 1,
	    queryEnd = url.length+1 ,
	    query = url.slice(queryStart, queryEnd - 1),
	    pairs = query.replace(/\+/g," ").split("&");

	if(query == url || query == "") {
		return;
	}

	for (i = 0; i < pairs.length; i++) {
		var param = pairs[i].split("=");
		var key = decodeURIComponent(param[0]);
		var val = decodeURIComponent(param[1]);
		if (key == keyNeeded) {
		    accessToken = val;
		    return val;
		}
	}

	return "";
}

function fetchGroupmeMessages() {
    var numGot =0;
    var firstTime = true;
    var beforeid ="";

    getGroupmeMessages(beforeid, numGot, firstTime);
}

function writeGroupMeMsgs(msg) {
    allMessages += msg;
}
function sleep(milliseconds) {
    var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
}

// Function to print the group me message so we know what we got.
function processMessage(message, index) {


        if(message.attachments.length != 0 && "image" == message.attachments[0].type && message.favorited_by.length > threshFavoriteImages) {
            outputMessageDetails(message.attachments[0].url,
                    message.created_at,
                    message.favorited_by.length ,
                    message.text,
                    message.name);
            //overlayImage(message, getImageNameSixDigits(numGot));
        } else if(message.favorited_by.length > threshFavoriteText) {
            //textImage(message, getImageNameSixDigits(numGot));
            outputMessageDetails("", message.created_at,message.favorited_by.length,message.text, message.name);
        }


}

function outputMessageDetails(url, createdat, numFavorited, text, personName) {
    writeGroupMeMsgs("<tr>");
            if(url != "") {
                writeGroupMeMsgs("<td><img width=\"90\" height=\"90\"src=\""+url+"\"/></td>");
            } else {
                writeGroupMeMsgs("<td></td>");
            }
            writeGroupMeMsgs("<td>" + getFormattedTime(createdat) + "</td><td>" + personName + "</td><td>" +  numFavorited + "</td><td>" + text + "</td>");

    writeGroupMeMsgs("</tr>");
}

function getFormattedTime(unixtimestamp) {
  var date = new Date(unixtimestamp * 1000);
  return  date.toDateString();
}

function getGroupmeMessages(beforeId, numGot, firstTime) {

        var beforeIdAddition = (beforeId != "")? "&before_id="+beforeId : "";
        var url = new URL("https://api.groupme.com/v3/groups/"+groupId+"/messages?token=" + accessToken + beforeIdAddition);
        var conn =  new XMLHttpRequest();
        var response = "";
        conn.onreadystatechange = function() {
                if (conn.readyState == 4 && conn.status == 200) {
                    response= conn.responseText;
                    groupMeObj = JSON.parse(response).response;
                    numMessages = groupMeObj.count;
                    beforeId = groupMeObj.messages[groupMeObj.messages.length-1].id;
                    if( firstTime) {
                         writeGroupMeMsgs("<table>");
                         firstTime = false;
                    }
                    numGot +=20; // SInce we get only 20 message at  time.
                    groupMeObj.messages.forEach(processMessage);

                    // Stop when we get the max allowed number.
                    if (numGot < maxPullNumMsgs) {
                        getGroupmeMessages(beforeId, numGot, firstTime);
                    } else {
                        writeGroupMeMsgs("</table>");
                        document.write(allMessages);
                    }
                }
        }
        conn.open("GET", url, true);
        conn.send();
}

// ENtry point when the submit button is pressed from the previous page.
function submitForGroupmeMessages() {
    var gid = document.getElementById("listOfGroups").value;
    var popularityMin = document.getElementById("popMin").value;
    var popularityMax = document.getElementById("popMax").value;
    var startdt = document.getElementById("startdate").value;
    window.location.replace("getslideshow.html?at="+accessToken+"&gid="+gid+"&pn="+popularityMin+"&px="+popularityMax+"&sd="+startdt);

}


function getImageNameSixDigits(number) {
        var imageName = "temp/image_";
        var divisor = 100000;
        while(number/divisor==0) {
            imageName = imageName+"0";
            divisor/=10;
        }
        return imageName+number;
}

// FUnction that gets all the groups available for the user
function getGroupsAvailable(accessToken) {
        var url = new URL("https://api.groupme.com/v3/groups?token=" + accessToken);
        var conn =  new XMLHttpRequest();
        var response = "";
        conn.onreadystatechange = function() {
            if (conn.readyState == 4 && conn.status == 200) {
                response= conn.responseText;
                groupMeObj = JSON.parse(response).response;
                writeGroupOptions(groupMeObj);
            }
        }
        conn.open("GET", url, true);
        conn.send();
}

// Print the available groups in the form of a form, with options. so people can choose which group they want to see next.
function writeGroupOptions(groupsList) {

    var startForm="<option value=\"";
    var endForm="</option>";
    var printedGroupList ="";
    for(index in groupsList) {
        printedGroupList = printedGroupList + startForm + groupsList[index].id + "\">" + groupsList[index].name +
                    " ( " + groupsList[index].members.count + " ) " + endForm;
    }

    document.getElementById("listOfGroups").innerHTML = printedGroupList;

}


/**********************************
 **** Functions for get slideshow
 **********************************/
function saveVariablesForSlideshow() {
    var queryStart = url.indexOf("?") + 1,
    	    queryEnd = url.length+1 ,
    	    query = url.slice(queryStart, queryEnd - 1),
    	    pairs = query.replace(/\+/g," ").split("&");

    if(query == url || query == "") {
        return;
    }

    for (i = 0; i < pairs.length; i++) {
        var param = pairs[i].split("=");
        var key = decodeURIComponent(param[0]);
        var val = decodeURIComponent(param[1]);
        if (key == "gid") {
            groupId = val;
        } else if (key == "pn") {
            popMin = val;
        } else if (key == "px") {
            popMax = val;
        } else if (key == "at") {
            accessToken = val;
        } else if (key == "sd") {
            startDate = val;
        }
    }
}

