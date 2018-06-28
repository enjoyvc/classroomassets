var RecordTool = {

	create: function() 
	{
		var tool = {};
		var plugin = null;

		tool.init = function() 
		{
			if(plugin == null) {
				plugin = document.getElementById('vcnativecmd');
				plugin.addEventListener("message", onRecordEvent, false);
			}
		};

		tool.launchrecord = function()
		{
			plugin.postMessage({cmd:"launchrecord"});
		};

		tool.recordaudio = function()
		{
			plugin.postMessage({cmd:"recordaudio"});
		};

		tool.recordwindow = function()
		{
			plugin.postMessage({cmd:"recordwindow"});
		};

		tool.recordscreen = function()
		{
			plugin.postMessage({cmd:"recordscreen"});
		};

		tool.stoprecord = function()
		{
			plugin.postMessage({cmd:"stoprecord"});
		};

		tool.getrecord = function()
		{
			plugin.postMessage({cmd:"getrecordstatus"});
		};

		tool.exitrecord = function()
		{
			plugin.postMessage({cmd:"exitrecord"});
		};

		tool.setrecorddir = function()
		{
			plugin.postMessage({cmd:"setrecorddir",data:"d:\\111\\22\\"});
		};

		tool.setrecordqua = function()
		{
			plugin.postMessage({cmd:"setrecordqua",data:"9"});
		};

		tool.setrecordfps = function()
		{
			plugin.postMessage({cmd:"setrecordfps",data:"20"});
		};

		tool.setrecordscl = function()
		{
			plugin.postMessage({cmd:"setrecordscl",data:"2.0"});
		};

		return tool;
	}
};

var recordView = {
	create: function() 
	{
		var view = {};
		var recShowRecordOptions = "pop-employ";
		var recHideRecordOptions = "pop-employ none";
		var recNormalOptions = "prv-ico";
		var recHighlineOptions = "prv-ico prv-ico-g";
		var recShowStatus = "pop-reding";
		var recHideStatus = "pop-reding none";
		var recordStatusId = "recordStatus"
		var recordOptionsId = "recordOptions";
		var recordButtonId = "showRecordButton";
		//var recShowRecordOptionWindow = false;

		var tool = RecordTool.create();
		var inputSrc = null;
		var recStatus = 0;
		var recording = 'stop';

		view.setRecordParam = function() {
			tool.init();
			if(recording == 'stop') 
				view.showOrHideRecord();
			else {
				view.showOrHideStatus();
			}
		}

		view.showRecord = function()
		{
			document.getElementById(recordOptionsId).className = recShowRecordOptions; 
		};

		view.hideRecord = function() 
		{
			document.getElementById(recordOptionsId).className = recHideRecordOptions; 
		};

		view.showOrHideRecord = function() {
			if(document.getElementById(recordOptionsId).className == recShowRecordOptions) 
				view.hideRecord();
			else
				view.showRecord();
		}

		view.showStatus = function() 
		{
			document.getElementById(recordStatusId).className = recShowStatus; 
		};

		view.hideStatus = function() 
		{
			document.getElementById(recordStatusId).className = recHideStatus; 
		};

		view.showOrHideStatus = function() 
		{
			if(document.getElementById(recordStatusId).className == recShowStatus) 
				view.hideStatus();
			else
				view.showStatus();
		};

		view.setInput = function(input) 
		{
			inputSrc = input;
		};

		view.start = function() 
		{
			if(recStatus != 0)
				return;
			tool.launchrecord();
			recording = 'start';
			view.hideRecord();
			setTimeout("rec.getVCRStatus()", 1000);
		};

		view.stop = function() 
		{
			tool.exitrecord();
			view.stoprec();
		};

		view.stoprec = function() 
		{
			recording = 'stop';
			view.hideStatus();
			view.hideRecord();
		};

		view.getVCRStatus = function() 
		{
			tool.getrecord();
		};

		view.setVCRStatus = function(status) {
			if(status == 0) {
				if(recStatus != 0) {
					document.getElementById(recordButtonId).className = recNormalOptions; 
					view.stoprec();
				}
				else
					setTimeout("rec.getVCRStatus()", 1000);
			}
			else if(status == 1) {
				if(recStatus == 2) {
					view.stoprec();
				}
				else if(recording == 'start') {
					if(inputSrc == 'recScreen')
						tool.recordscreen();
					else if(inputSrc == 'recWindow')
						tool.recordwindow();
					else if(inputSrc == 'recAudio')
						tool.recordaudio();
					else
						tool.recordscreen();
					recording = 'wait';
				}
				setTimeout("rec.getVCRStatus()", 1000);
			}
			else if(status == 2) {
				recording = 'rec';
				document.getElementById(recordButtonId).className = recHighlineOptions; 
				setTimeout("rec.getVCRStatus()", 1000);
			}
			recStatus = status;
		};

		return view;
	}
};

var rec = recordView.create();

function onRecordEvent(message)
{
	//alert(message.data.msg + ":" + message.data.data);
	//0:not launch
	//1:not rec
	//2:recording
	rec.setVCRStatus(parseInt(message.data.data));
}

var adImageLink;
var adLink;

function is_enjoyvc_url(url) {
    var parten = /(enjoyvc)/;
    return parten.test(url);
}

function login_pk(username) {
    if (typeof(username) == 'undefined' || username == null || username.length <= 0)
        return;
    var login = 'http://pk.enjoyvc.com:7070/enjoyvc/login?username=' + username + '&goto=' + adLink;
    window.open(login, '_blank', 'height=600,width=800,top=100,left=100');
}

function get_cookie(cookiename) {
    var result;
    var mycookie = document.cookie;
    var start2 = mycookie.indexOf(cookiename + "=");
    if (start2 > -1) {
        start = mycookie.indexOf("=", start2) + 1;
        var end = mycookie.indexOf(";", start);
        if (end == -1) {
            end = mycookie.length;
        }
        result = unescape(mycookie.substring(start, end));
    }
    return result;
}

function openAD() {
    if (is_enjoyvc_url(adLink))
        login_pk(get_cookie('username'));
    else 
        window.open(adLink, '_blank', 'height=600,width=800,top=100,left=100');
}

function showAD(obj) {
    adImageLink = obj.img;
    adLink = obj.prod;
    $('#adImage').attr('src', adImageLink);
    $('#adBox').show();
    setTimeout(function () { $('#adBox').hide(); }, 50000);
}

