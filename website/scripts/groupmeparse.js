
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
var allImages=new Array();
var failedImages=[];

// Following are needed to get the slideshow ready
var popMin=0;
var popMax=0;
var groupId="";
var startDate="";
var textMode=false;

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
    window.location.href = "getslideshow.html?at="+accessToken+"&gid="+gid+"&pn="+popularityMin+"&px="+popularityMax+"&sd="+startdt;

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
        printedGroupList = printedGroupList + startForm + groupsList[index].id + "\">" + groupsList[index].name +
                    " ( " + groupsList[index].members.length + " ) " + endForm;
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
    } else if(typeOfMessages == "video") {
        videoMode = true;
    }
    var numGot =0;
    var firstTime = true;
    var beforeid ="";


    getGroupmeMessages(beforeid, numGot, firstTime);
}

 //Outputs the image into the bigImageOutput place for the initial image
function showBigSlideShowIntro(message) {
    var showImageHtml = "<img src=\"images/waiting.gif\" alt=\"\">";/// max-height=\"300px\" max-width=\"500\">";
    document.getElementById("bigImageOutput").innerHTML=showImageHtml;
    document.getElementById("secIntro").innerHTML="This takes time.. Collecting and parsing all the groupme messages that you have! You could look below to see the thumbnails of your images being processed ";
}



// Function to print the group me message so we know what we got.
function processMessage(message, index) {

    if (message.favorited_by.length >= popMin && message.favorited_by.length < popMax) {
        if (textMode == true) {
            if(message.attachments.length == 0) {
                outputMessageDetails("", message.created_at,message.favorited_by.length,message.text, message.name);
                numProcessed++;
            }
        } else {

            if(message.attachments.length != 0 && "image" == message.attachments[0].type) {
                outputMessageDetails(message.attachments[0].url,
                        message.created_at,
                        message.favorited_by.length ,
                        message.text,
                        message.name);
                //overlayImage(message, getImageNameSixDigits(numGot));
                numProcessed++;
            }
        }
    }
}


function getGroupmeMessages(beforeId, numGot, firstTime) {

        var beforeIdAddition = (beforeId != "")? "&before_id="+beforeId : "";
        var url = new URL("https://api.groupme.com/v3/groups/"+groupId+"/messages?limit=100&acceptFiles=1&token=" + accessToken + beforeIdAddition);
        var conn =  new XMLHttpRequest();
        var response = "";
        conn.onreadystatechange = function() {
                if (conn.readyState == 4 && conn.status == 200) {
                    response= conn.responseText;
                    groupMeObj = JSON.parse(response).response;
                    numMessagesTotal = groupMeObj.count;
                    beforeId = groupMeObj.messages[groupMeObj.messages.length-1].id;
                    if( firstTime) {
                         showBigSlideShowIntro(groupMeObj.messages[0]);
                         firstTime = false;
                         publishImagesSoFar("");
                    } else {
                        // writeGroupMeMsgs("<li>")
                    }
                    numGot +=groupMeObj.messages.length; // SInce we get 100 message at  time.
                    groupMeObj.messages.forEach(processMessage);

                    // Stop when the last groupme message is below the startdate
                    if (groupMeObj.messages[0].created_at > startDate && numGot < numMessagesTotal-1 && groupMeObj.messages.length!=0) {
                        getGroupmeMessages(beforeId, numGot, firstTime);
                        publishImagesSoFar("");
                    } else {
                        var lastLineTitle ="";
                        if (numProcessed == 0) {
                            lastLineTitle = " title=\"There were no messages that matched your requirements! Try again, with another filter for the number of likes, or another group perhaps?\"";
                        }
                        publishImagesSoFar(lastLineTitle);
                        if(textMode) {
                            document.getElementById("imageList").style.visibility='hidden';
                            $('.secintro').hide();
                        }
                        startDisplayingImages();
                        document.getElementById("videoSection").style.visibility = "visible";
                    }
                }
        }
        conn.open("GET", url, true);
        conn.send();
}
function setTextMode() {
    textMode=true;
    order = "oldtonew";
}

function publishImagesSoFar(lastLineTitle) {
    var messagesToPrint = reverseMessages;
    if(lastLineTitle=="") {
        lastLineTitle=" title=\";Thanks for using GroupmePensieve!\"";
    }
    if (order == "newtoold") {
        messagesToPrint = allMessages;
    }

    var firstLineUsual = "<li class=\"first\"></li>"
    var lastLineUsual = "<li class=\"last\"><img src=\"images/groupme-icon.png\"" + lastLineTitle + "></li>";
    document.getElementById("imageList").innerHTML=firstLineUsual + messagesToPrint + lastLineUsual;
}

function startDisplayingImages() {

    $.gallerax({
                                outputSelector: 		'#bigImageOutput img',				// Output selector
                                thumbnailsSelector:		'.thumbnails li img',		// Thumbnails selector
                                captionSelector:		'#captions .line',			// Caption selector
                                captionLines:			2,							// Caption lines (3 lines)
                                fade: 					'fast',						// Transition speed (fast)
                                navNextSelector:		'#nav a.navNext',			// 'Next' selector
                                navPreviousSelector:	'#nav a.navPrevious',		// 'Previous' selector
                                navFirstSelector:		'#nav a.navFirst',			// 'First' selector
                                navLastSelector:		'#nav a.navLast',			// 'Last' selector
                                navStopAdvanceSelector:	'#nav a.navStopAdvance',	// 'Stop Advance' selector
                                navPlayAdvanceSelector:	'#nav a.navPlayAdvance',	// 'Play Advance' selector
                                advanceFade:			'fast',						// Advance transition speed (slow)
                                advanceDelay:			1000,						// Advance delay (3 seconds)
                                advanceResume:			1000,						// Advance resume (12 seconds)
                                thumbnailsFunction: 	function(s) {				// Thumbnails function
                                    return s;
                                    //return s.replace(/_thumb\.jpg$/, '.jpg');

                                }
                            });

}

function outputMessageDetails(url, createdat, numFavorited, captionInside, personName) {
    var textOutput="";
    if(!textMode) {
        textOutput = "<li><img src=\""+url+"\"" + " title=\";";
    } else {
        textOutput = "<li><img src=\"images/black.jpg\"" + " title=\"";
    }
    if(captionInside=="" || captionInside==null) {
        captionInside= "";
    }

    textToWrite= " &hearts; " +  numFavorited + " &hearts;&nbsp;&nbsp;&nbsp;" + getFormattedTime(createdat) + "&nbsp;&nbsp;&nbsp;&nbsp;" + captionInside + " - " + personName + "\"";
    textOutput += textToWrite;
    var obj = {};
    // Weird hack for now to exclude this picture that somehow gets a forbidden error and doesn't exist anymore :(
    if (url.includes("4a14c57a23e94f9a94e5a1bc8cbee6b9")) {
        return;
    }
    obj["url"] = url;
    obj["text"] = "♥ " + numFavorited + " ♥" + "\n" + getFormattedTime(createdat) + "\n" + captionInside + "\n" + personName;
    allImages.push(obj);

    textOutput += " alt=\"\"/></li>";
    writeGroupMeMsgs(textOutput);
}

function writeGroupMeMsgs(msg) {
    allMessages += msg;
    reverseMessages = msg + reverseMessages;
}

function getFormattedTime(unixtimestamp) {
  var date = new Date(unixtimestamp * 1000);
  return  date.toDateString();
}

function getImages()  {
    return allImages;
}
/*
function getStats() {
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
                            getGroupmeMessages(beforeId, numGot, firstTime);
                            publishImagesSoFar("");
                        } else {

                        }
                    }
            }
            conn.open("GET", url, true);
            conn.send();
}


// Function to print the group me message so we know what we got.
function getStatForMessage(message, index) {

    if (message.favorited_by.length > popMin && message.favorited_by.length < popMax) {
        if (textMode == true) {
            if(message.attachments.length == 0) {

                numProcessed++;
            }
        } else {

            if(message.attachments.length != 0 && "image" == message.attachments[0].type) {
                outputMessageDetails(message.attachments[0].url,
                        message.created_at,
                        message.favorited_by.length ,
                        message.text,
                        message.name);
                //overlayImage(message, getImageNameSixDigits(numGot));
                numProcessed++;
            }
        }
    }
}*/