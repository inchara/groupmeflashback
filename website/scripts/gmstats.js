
/**********************************
 **** Global variables
 **********************************/
// COOKIE NAMES
var COOKIE_ACCESSTOKEN = "ACCESS_TOKEN";
var COOKIE_GROUPID = "GROUP_ID";
var COOKIE_POPMAX = "POP_MAX";
var COOKIE_POPMIN = "POP_MIN";
var COOKIE_STARTDATE = "START_DATE";


var accessToken = "initial";
var threshFavoriteText = 30;
var maxPullNumMsgs = 500;
var numMessages = 0;
var groupmeBatch ;
var allMessages=" ";
var reverseMessages=" ";
var numProcessed = 0;
var order = "oldtonew";
var videoMode=false;
var allImages=[];

// Following are needed to get the slideshow ready
var popMin=0;
var popMax=0;
var groupId="";
var startDate="";
var textMode=false;


// Stats
var keyNumMsgs = "numMessages";
var keyPostImages = "numImagesPosted";
var keyPostTexts = "numTextPosted";
var keyAvgLikes= "avgLikes";
var keyAvgLiked="avgLiked";

var people = new Object();
//Saved as people["nameOfPerson"] = object.
var personWithMaxMessages="";
var personWithMaxAvgLikes="";
var personWhoPostsMostImages="";
var personWhoPostsMostTexts="";
var personWithLeastActivity="";
var mostLikedMessage="";
var totalNumTexts=0;
var totalNumImages=0;
var maxLikesForOneMessage=0;
/**********************************
 **** Functions To Save Parameters
 **********************************/
function checkForParam(url, keyNeeded) {
	var queryStart = url.indexOf("?") + 1,
	    queryEnd = url.length+1 ,
	    query = url.slice(queryStart, queryEnd - 1),
	    pairs = query.replace(/\+/g," ").split("&");

	if(query == url || query == "") {
	    saveFromCookies();
		return;
	}

	for (i = 0; i < pairs.length; i++) {
		var param = pairs[i].split("=");
		var key = decodeURIComponent(param[0]);
		var val = decodeURIComponent(param[1]);
		if (key == keyNeeded) {
		    accessToken = val;
		    setCookie(COOKIE_ACCESSTOKEN, accessToken);
		    return val;
		}
	}

	return "";
}

function saveFromCookies() {
        accessToken=getCookie(COOKIE_ACCESSTOKEN);
	    groupId=getCookie(COOKIE_GROUPID);
	    popMax=getCookie(COOKIE_POPMAX);
	    popMin=getCookie(COOKIE_POPMIN);
	    startDate=getCookie(COOKIE_STARTDATE);
}

function setCookie(cname, cval) {
    var d = new Date();
    d.setTime(d.getTime() + (1*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cval + "; " + "expires=" + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function sleep(milliseconds) {
    var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
          break;
        }
      }
}


/**********************************
 **** Functions for getGroupme
 **********************************/
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
function getGroupsAvailable() {
        saveFromCookies();
        if(accessToken=="initial") {
            document.getElementById("errorBar").innerHTML="It looks like you haven't entered your groupme credentials to fetch groups";
        } else {
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
}

// Print the available groups in the form of a form, with options. so people can choose which group they want to see next.
function writeGroupOptions(groupsList) {

    var startForm="<option value=\"";
    var endForm="</option>";
    var printedGroupList ="";
    for(index in groupsList) {
        printedGroupList = printedGroupList + startForm + groupsList[index].id + "\">" + groupsList[index].name + endForm;
    }

    document.getElementById("listOfGroups").innerHTML = printedGroupList;

}


/**********************************
 **** Functions for get slideshow
 **********************************/
function saveVariablesForSlideshow() {
    var url = window.location.href;
    var queryStart = url.indexOf("?") + 1,
    	    queryEnd = url.length+1 ,
    	    query = url.slice(queryStart, queryEnd - 1),
    	    pairs = query.replace(/\+/g," ").split("&");

    if(query == url || query == "") {
        saveFromCookies();
        return;
    }

    for (i = 0; i < pairs.length; i++) {
        var param = pairs[i].split("=");
        var key = decodeURIComponent(param[0]);
        var val = decodeURIComponent(param[1]);
        if (key == "gid") {
            groupId = val;
            setCookie(COOKIE_GROUPID, groupId);
        } else if (key == "pn") {
            popMin = val;
            setCookie(COOKIE_POPMIN, popMin);
        } else if (key == "px") {
            popMax = val;
            setCookie(COOKIE_POPMAX, popMax);
        } else if (key == "at") {
            accessToken = val;
            setCookie(COOKIE_ACCESSTOKEN, accessToken);
        } else if (key == "sd") {
            startDate = (new Date(val)).getTime()/1000;
            setCookie(COOKIE_STARTDATE, startDate);
        }
    }
}

function fetchGroupmeMessages(typeOfMessages) {
    if(typeOfMessages == "text") {
        setTextMode();
    } else if(typeOfMessages == "newtoold") {
        order = "newtoold";
    } else if(typeOfMessages == "stats") {
        videoMode = true;
    }
    var numGot =0;
    var firstTime = true;
    var beforeid ="";


    getGroupmeMessages(beforeid, numGot, firstTime);
}

function setTextMode() {
    textMode=true;
    order = "oldtonew";
}

function getStats(beforeId, numGot, firstTime) {
    var beforeIdAddition = (beforeId != "")? "&before_id="+beforeId : "";
            var url = new URL("https://api.groupme.com/v3/groups/"+groupId+"/messages?acceptFiles=1&token=" + accessToken + beforeIdAddition);
            var conn =  new XMLHttpRequest();
            var response = "";
            conn.onreadystatechange = function() {
                    if (conn.readyState == 4 && conn.status == 200) {
                        response= conn.responseText;
                        groupMeObj = JSON.parse(response).response;
                        numMessages = groupMeObj.count;
                        beforeId = groupMeObj.messages[groupMeObj.messages.length-1].id;
                        if( firstTime) {
                             firstTime = false;
                        } else {
                            // writeGroupMeMsgs("<li>")
                        }
                        numGot +=20; // SInce we get only 20 message at  time.
                        groupMeObj.messages.forEach(getStatForMessage);

                        // Stop when the last groupme message is below the startdate
                        if (groupMeObj.messages[0].created_at > startDate && numGot < numMessages) {
                            getStats(beforeId, numGot, firstTime);
                            publishImagesSoFar("");
                        } else {
                            finalizeStats();
                            displayPrizes();
                        }
                    }
            }
            conn.open("GET", url, true);
            conn.send();
}


// Function to print the group me message so we know what we got.
function getStatForMessage(message, index) {
    var personName = message.nickname;
    if(people[personName]==null) {
        people[personName] = new Object();
        people[personName][keyPostImages]=0;
        people[personName][keyPostTexts]=0;
        people[personName][keyNumMsgs]=0;
        people[personName][keyAvgLikes]=0;
        people[personName][keyTotalLikes]=0;
    }
    if (message.favorited_by.length > popMin && message.favorited_by.length < popMax) {
            if(maxLikesForOneMessage > message.favorited_by.length) {
                maxLikesForOneMessage = message.favorited_by.length;
                mostLikedMessage = message;
            }
            if(message.attachments.length == 0) {
                people[personName][keyPostTexts]++;
                totalNumTexts++;
            }
            if(message.attachments.length != 0 && "image" == message.attachments[0].type) {
                people[personName][keyPostImages]++;
                totalNumImages++;
            }
            people[personName][keyNumMsgs]++;
            people[personName][keyTotalLikes]+=message.favorited_by.length;
    }
}



// Function to print the group me message so we know what we got.
function finalizeStats() {
   var likedMostMessages=0;
   var postedMostTexts=0;
   var postedMostImages=0;
   var postedLeast=9999;
   var postedAvgLikes=0;
   var postedMostMsgs=0;

   for(var key in people) {
        if(people.hasOwnProperty(key)) {
            people[key][keyAvgLikes] = people[key][keyTotalLikes]/people[key][keyNumMsgs];
        }
        if(people[key][keyPostImages] > postedMostImages) {
            postedMostImages = people[key][keyPostImages];
            personWhoPostsMostImages = key;
        }
        if(people[key][keyPostTexts] > postedMostTexts) {
            postedMostTexts = people[key][keyPostTexts];
            personWhoPostsMostTexts = key;
        }
        if(people[key][keyNumMsgs] < postedLeast) {
            postedLeast = people[key][keyNumMsgs];
            personWithLeastActivity = key;
        }
        if(people[key][keyNumMsgs] > postedMostMsgs) {
            postedMostMsgs = people[key][keyNumMsgs];
            personWithMaxMessages = key;
        }
        if(people[key][keyAvgLikes] > key) {
            postedAvgLikes = people[key][keyAvgLikes];
            personWithMaxAvgLikes = key;
        }
   }
}

function displayPrizes() {
    var item = document.getElementById("stats");
    var htmlDisplay = "<table>
                         <thead>
                           <tr>
                             <th width=\"200\">Table Header</th>
                             <th>Table Header</th>
                             <th width=\"150\">Table Header</th>
                             <th width=\"150\">Table Header</th>
                           </tr>
                         </thead>
                         <tbody>
                           <tr>
                             <td>Content Goes Here</td>
                             <td>This is longer content Donec id elit non mi porta gravida at eget metus.</td>
                             <td>Content Goes Here</td>
                             <td>Content Goes Here</td>
                           </tr>
                           <tr>
                             <td>Content Goes Here</td>
                             <td>This is longer Content Goes Here Donec id elit non mi porta gravida at eget metus.</td>
                             <td>Content Goes Here</td>
                             <td>Content Goes Here</td>
                           </tr>
                           <tr>
                             <td>Content Goes Here</td>
                             <td>This is longer Content Goes Here Donec id elit non mi porta gravida at eget metus.</td>
                             <td>Content Goes Here</td>
                             <td>Content Goes Here</td>
                           </tr>
                         </tbody>
                       </table>"

}