

// load sipml5-API
var bfSIPml = bfSIPml || {};
bfSIPml = (function(){
		function _conference_manager(){
			return new conference_manager();
		}
		var _instance;
		return{
			name: 'bfSIPml.ConferenceManager',
			description: 'get conference manager...',
			ConferenceManager: function(){
				if(typeof _instance === 'undefined'){
					_instance = new _conference_manager();
				}
				return _instance;
			}
		};
})();
// global manager instance
var cfManager = bfSIPml.ConferenceManager();
var protocol = document.location.protocol ;
var hostName = window.location.host;
add_js_script(protocol+'//'+hostName+'/classroomassets/javascripts/src/SIPml-api.js');
add_js_script(protocol+'//'+hostName+'/classroomassets/javascripts/src/Recorderjs/recorder.js');
add_js_script(protocol+'//'+hostName+'/classroomassets/javascripts/src/Recorderjs/recorderWorker.js');


/* conference manager interface */
function conference_manager() {
	/* ==================define Member variables ======================== */ 
	this.name = 'conference_manager';
	this.description = 'conference manager interface...';
	
	ret_code = {
		STATUS_NO: 	0,
		REG_FAIL: 	1010,
		REG_ING: 		1011,
		REG_OK: 		1012,
		REG_EXPIRES: 1013,
		UNREG_FAIL: 1020,
		UNREG_ING: 	1021,
		UNREG_OK: 	1022,
		UNREG_INFO:	1023,
		ROOM_FAIL: 	2010,
		ROOM_ING: 	2011,
		ROOM_NOT: 	2012,
		ROOM_OK: 		2013,
		CALL_FAIL: 	3010,
		CALL_ING: 	3011,
		CALL_SEND: 	3012,
		CALL_SET: 	3013,
		CALL_OK: 		3014,
		CALL_MEDIA: 3015,
		CALL_INCOME:3016,
		CALL_ERROR:	3017,
		CALL_LOFAIL:3018,
		CALL_ROFAIL:3019,
		MEET_FAIL:	4010,
		MEET_OTHER: 4011,
		MEET_LIST: 	4012,
		MEET_NOT: 	4013,
		MEET_COME:	4014,
		MEET_EXIST:	4015,
		MEET_JOIN:	4016,
		MEET_LEAVE:	4017,
		MEET_CREATE:4018,
		MEET_DELELE:4019,
		MEET_INFO:	4020,
		MEET_CTRL:	4021,
		HANGUP_FAIL:5010,
		HANGUP_ING:	5011,
		HANGUP_OK:	5012,
		SIP_INFO:		6010,
		SIP_MESSAGE:6011,
		SIP_INVITE:	6012,
		MEIDA_ACCEPT:7010,
		MEDIA_REJECT:7011,
		IM_INCOME:	8010,
		STACK_FAIL: 9010,
		STACK_ING: 	9011,
		STACK_OK: 	9012,
		BUDD_FAIL: 	10010,
		BUDD_ADD:		10011,
		BUDD_GET:		10012,
		BUDD_DEL:		10013,
		BUDD_LIST:	10014,
		BUDD_INIT:	10015,
		BUDD_MGR:		10016,
		USER_OBJ:		11000
	};
	
	var _This = this;
	
	this.oUser = null; 
	
	this.cbMsgInfo = null;
	this.disableDebug = false;
	this.disableVideo = false;
	this.isPerfTest = false;
	
	this.isMedia = true; // add by Taurus.Feng.20141027 split media or MI
	
	// status
	this.b_initialized 	= ret_code.STATUS_NO;
	
	// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
	this.rand = 0;

	/* ==================define Member functions ======================== */ 
	
	/* check user valid */
	this.oUserCheck = function() {
		if(!this.oUser)
			return null;
		if(this.oUser.b_regStatus == ret_code.UNREG_OK || this.oUser.b_regStatus == ret_code.UNREG_ING 
		|| this.oUser.b_regStatus == ret_code.REG_FAIL || this.oUser.b_regStatus == ret_code.REG_EXPIRES)
			return null;
		return true;
	}

	/* 1.A init global Environment Variables */
	this.appInit = function(oParam) {
		if(window.console) {
			window.console.info("location=" + window.location);
		}
	
		this.cbMsgInfo 		= oParam.cb_MsgInfo?oParam.cb_MsgInfo:function(){alert("Please set Message Callback Function to Asynchronous!");return;};
		this.disableDebug = oParam.disableDebug?oParam.disableDebug:false;
		this.disableVideo = oParam.disableVideo?oParam.disableVideo:false;
		this.isPerfTest 	= oParam.isPerfTest?oParam.isPerfTest:false;
		this.isMedia			= oParam.isMedia!==undefined?oParam.isMedia:true;
		this.publicipserver = (oParam.ipsever&&(oParam.ipsever instanceof Array)&&oParam.ipsever.length&&oParam.ipsever[0].url)?oParam.ipsever:undefined;		
		
		// why setInterval timer not >>>> this.oReadyStateTimer
		conference_manager.oReadyStateTimer = setInterval(function () {
				if (document.readyState === "complete") {
					clearInterval(conference_manager.oReadyStateTimer);
					// set log level : info|warn|error|fatal
					SIPml.setDebugLevel(_This.disableDebug);
					// initialize SIPML5
					SIPml.init(_This.isMedia, _This.publicipserver, _postInit); // add by Taurus.Feng.20141027 split media or MI
				}
			},
		500);

		// devices info
		if(oParam.cb_CheckMedia)
			this.checkInit(oParam.cb_CheckMedia);
	};
	
	/* 2.A app sip register */
	this.sipRegister = function (oExpertP) {
		// catch exception for IE (DOM not ready)
    try {
    	   	  
        // create User and SIP stack
        this.oUser = new confer_mgr_user(this);
        this.oUser.init(oExpertP);
        var oSipStack = this.oUser.CreateStack();
        if (oSipStack.start() != 0) {
        		this.b_initialized = ret_code.STATUS_NO;
            this.cbMsgInfo(ret_code.REG_FAIL, '<b>Failed to start the SIP stack</b>');
        }
        else { 
        	this.b_initialized = ret_code.STACK_OK;
        	return;
        }
    }
    catch (e) {
        this.cbMsgInfo(ret_code.REG_FAIL, "<b>2:" + e + "</b>");
    }
	};
	
	/* 2.B sends SIP REGISTER (expires=0) to logout */
	this.sipUnRegister = function () {
		//
		if(!this.oUser)
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
		 	this.oUser.UnRegister();
	};
	
	/* 2.C release call resource, transport stack etc */
	this.unCallAll = function(){
		// release room
		if(this.oUser) this.oUser.MeetingLeaveAll();
		
		if(this.oUser && this.oUser.oSipSessionRegister)
			this.oUser.oSipSessionRegister.unregister();
		if(this.oUser && this.oUser.oSipStack && this.oUser.oSipStack.o_stack && this.oUser.oSipStack.o_stack.o_layer_transport)
			this.oUser.oSipStack.o_stack.o_layer_transport.stop();
	};
	
	/* 3.A Join Meeting */
	this.sipMeetingJoin = function(to_number, room_id) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingJoin(to_number, room_id);
	};
	
	/* 3.B Leave Meeting */
	this.sipMeetingLeave = function(to_number, room_id) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingLeave(to_number, room_id);
	};
	
	/* 3.C create Meeting */
	// publish three scheme to test 20140903
	this.sipMeetingCreate = function(to_number, room_id, scheme) {
		var s_type = scheme && scheme.type;
		if(s_type == undefined || s_type == "")
			return;
		var nodes;
		switch (s_type) {
			case "1": //PSAV+PSAVD+PSAM(15+31+43)
				nodes = [{"area": "1000", "num": "1", "type": "15"},{"area": "1000", "num": "1", "type": "31"},{"area": "1000", "num": "1", "type": "43"}];
				break;
			case "2": //(PSAV+PSAVD)*2+PSAM(15+31+43
				nodes = [{"area": "1000", "num": "1", "type": "15"},{"area": "1000", "num": "1", "type": "31"},{"area": "1001", "num": "1", "type": "15"},{"area": "1001", "num": "1", "type": "31"},{"area": "1000", "num": "1", "type": "43"}];
				break;
			case "3": //(PSAV+PSAVD)*3+PSAM(15+31+43)
				nodes = [{"area": "1000", "num": "1", "type": "31"},{"area": "1001", "num": "1", "type": "31"},{"area": "3001", "num": "1", "type": "31"},{"area": "1002", "num": "1", "type": "31"},{"area": "1000", "num": "1", "type": "43"}, {"area": "1000", "num": "1", "type": "15"},{"area": "1001", "num": "1", "type": "15"},{"area": "3001", "num": "1", "type": "15"}, {"area": "1002", "num": "1", "type": "15"}];
				break;
			case "4":
				nodes = [{"area": "1000", "num": "1", "type": "4"},{"area": "1000", "num": "1", "type": "1"},{"area": "1000", "num": "2", "type": "2"},{"area": "1001", "num": "1", "type": "1"},{"area": "1001", "num": "1", "type": "2"}];
				break;
			case "5": //(PSA PSV PSAD PSVD)*3+PSAM
				nodes = [{"area": "1000", "num": "1", "type": "11"},{"area": "1000", "num": "1", "type": "7"},{"area": "1000", "num": "1", "type": "27"},{"area": "1000", "num": "1", "type": "23"},{"area": "1001", "num": "1", "type": "11"},{"area": "1001", "num": "1", "type": "7"},{"area": "1001", "num": "1", "type": "27"},{"area": "1001", "num": "1", "type": "23"},{"area": "3001", "num": "1", "type": "11"},{"area": "3001", "num": "1", "type": "7"},{"area": "3001", "num": "1", "type": "27"},{"area": "3001", "num": "1", "type": "23"},{"area": "1000", "num": "1", "type": "43"}];
				break;
			case "6": //(PSA PSV PSAD PSVD)*2+PSAM
				nodes = [{"area": "1000", "num": "1", "type": "11"},{"area": "1000", "num": "1", "type": "7"},{"area": "1000", "num": "1", "type": "27"},{"area": "1000", "num": "1", "type": "23"},{"area": "1001", "num": "1", "type": "11"},{"area": "1001", "num": "1", "type": "7"},{"area": "1001", "num": "1", "type": "27"},{"area": "1001", "num": "1", "type": "23"},{"area": "1000", "num": "1", "type": "43"}];
				break;
			case "7": //(PSAV+PSAVD)*4+PSAM(15+31+43)
				nodes = [{"area": "1000", "num": "1", "type": "15"},{"area": "1000", "num": "1", "type": "31"},{"area": "1001", "num": "1", "type": "15"},{"area": "1001", "num": "1", "type": "31"},{"area": "3001", "num": "1", "type": "15"},{"area": "3001", "num": "1", "type": "31"},{"area": "1000", "num": "1", "type": "43"},{"area": "1002", "num": "1", "type": "15"},{"area": "1002", "num": "1", "type": "31"}];
				break;
			case "8":
				nodes = [{"area": "1000", "num": "1", "type": "31"},{"area": "1001", "num": "1", "type": "31"},{"area": "3001", "num": "1", "type": "31"},{"area": "1000", "num": "1", "type": "43"},{"area": "1002", "num": "1", "type": "31"}];
				break;
			default:  //VP+VS+AP+AS+PSAM+VPD+VSD+APD+ASD(5+6+9+10+43+21+22+25+26)
				nodes = [{"area": "3001", "num": "1", "type": "5"},{"area": "3001", "num": "1", "type": "6"},{"area": "3001", "num": "1", "type": "9"},{"area": "3001", "num": "1", "type": "10"},{"area": "1000", "num": "1", "type": "43"},{"area": "1000", "num": "1", "type": "21"},{"area": "1000", "num": "1", "type": "22"},{"area": "1000", "num": "1", "type": "25"},{"area": "1000", "num": "1", "type": "26"}];
				break;
		}
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingCreate(to_number, room_id, nodes);
	};
	
	/* 3.D delete Meeting */
	this.sipMeetingDelete = function(to_number, room_id) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingDelete(to_number, room_id);
	};
	
	/* 3.E get Meeting publish info*/
	this.sipMeetingPublishInfo = function(to_number, room_id) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingPublishInfo(to_number, room_id);
	};
	
	/* 3.F send IM */
	this.sipSendIM = function(to_number, room_id, content) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingSendIM(to_number, room_id, content);
	};
	
	/* 3.G send Meeting publish control, for Keep silence */
	this.sipMeetingPublishControl = function(to_number, room_id, a_type, a_source) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingPublishControl(to_number, room_id, a_type, a_source);
	};
	
	/* 3.H create Meeting , param nodes for multi mcu*/
	this.sipMeetingCreateEx = function(to_number, room_id, nodes) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingCreate(to_number, room_id, nodes);
	};

	/* 3.H update Meeting , param nodes for multi mcu*/
	this.sipMeetingUpdateEx = function(to_number, room_id, nodes) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.MeetingUpdate(to_number, room_id, nodes);
	};
	
	/*=========================buddy manage begin=====================================*/
	/* 3.I.1 buddy manage, init buddy By Taurus.Feng.2014-09-15*/
	this.sipBuddyManageInit = function(b_type, b_auto) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageInit(b_type, b_auto);
	}
	/* 3.I.2 buddy manage, add buddy By Taurus.Feng.2014-09-15*/
	this.sipBuddyManageAdd = function(scheme, b_type) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageAdd(scheme, b_type);
	}
	
	this.sipBuddyManageAllow = function(scheme, b_allow) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageAllow(scheme, b_allow);
	}
	
	/* 3.I.3 buddy manage, get buddy By Taurus.Feng.2014-09-15*/
	this.sipBuddyManageGet = function(scheme, b_type) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageGet(scheme, b_type);
	}
	
	/* 3.I.4 buddy manage, del buddy By Taurus.Feng.2014-09-15*/
	this.sipBuddyManageDel = function(scheme, b_type) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageDel(scheme, b_type);
	}
	
	/* 3.I.5 buddy manage, send buddy By Taurus.Feng.2014-09-15*/
	this.sipBuddyManageSend = function(scheme, b_type) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageSend(scheme, b_type);
	}
	
	/* 3.I.6 buddy manage, get buddy By Taurus.Feng.2014-09-15*/
	this.sipBuddyManageGetChatH = function(scheme, b_type) {
		if(!this.oUserCheck())
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
		else
			this.oUser.BuddyManageGetChatH(scheme, b_type);
	}
	
	/*=========================buddy manage over=====================================*/
	
	/* 4.A publish call to roomid, null(0) or publish(1) or subscibe(2) mode */
	this.sipPublishCall = function (s_type, room_id, o_ConfigMoreCall, cbCallInfo) {
		if(!this.oUserCheck()) {
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
			return null;
		}
		else {
			return this.oUser.CallPublish(s_type, room_id, o_ConfigMoreCall);
		}
	}

	/* 4.B subscribe call to roomid, null(0) or publish(1) or subscibe(2) mode */
	this.sipSubscribeCall = function (s_type, room_id, o_ConfigMoreCall) {
		if(!this.oUserCheck()) {
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
			return null;
		}
		else
			return this.oUser.CallSubscribe(s_type, room_id, o_ConfigMoreCall);
	}
	
	/* 4.C subscribe call to roomid, null(0) or publish(1) or subscibe(2) mode */
	this.sipNormalCall = function (s_type, room_id, o_ConfigMoreCall) {
		if(!this.oUserCheck()) {
			this.cbMsgInfo(ret_code.USER_OBJ, "oUser null");
			return null;
		}
		else
			return this.oUser.CallNormal(s_type, room_id, o_ConfigMoreCall);
	}
	
	
	/* 4.D terminates the call (SIP BYE or CANCEL) */
	this.sipHangUp = function(room_id, call_PhoneNumber) {
			var oSipSessionUnCall;
	    if (this.oUser && (oSipSessionUnCall = this.oUser._sipSessionPhoneNuber(call_PhoneNumber, "D"))) {
	    		this.cbMsgInfo(ret_code.HANGUP_ING, '<i>Terminating the call...</i>');
	        oSipSessionUnCall.hangup({events_listener: { events: '*', listener: this._onSipEventSession }});
	    }
	    else{
	    	alert('Not Call [' + call_PhoneNumber + '], not needed Hangup');
	    }
	}
	/* 4.E terminates the call (SIP BYE or CANCEL) */
	this.publishSipHangUp = function(room_id, call_PhoneNumber) {
			
	    if (this.oUser && (oSipSessionUnCall = this.oUser._sipSessionPhoneNuber(room_id, "D", call_PhoneNumber))) {
	    		this.cbMsgInfo(ret_code.HANGUP_ING, '<i>Terminating the call...</i>');
	        oSipSessionUnCall.hangup({events_listener: { events: '*', listener: this._onSipEventSession }});
	    }
	    else{
	    	//alert('Not Call [' + call_PhoneNumber + '], not needed Hangup');
	    }
	}
	/* 4.F terminates the call (SIP BYE or CANCEL) */
	this.subscribeSipHangUp = function(room_id, call_PhoneNumber) {
			
	    if (this.oUser && (oSipSessionUnCall = this.oUser._sipSessionPhoneNuber(room_id, "D", call_PhoneNumber))) {
	    		this.cbMsgInfo(ret_code.HANGUP_ING, '<i>Terminating the call...</i>');
	        oSipSessionUnCall.hangup({events_listener: { events: '*', listener: this._onSipEventSession }});
	    }
	    else{
	    	//alert('Not Call [' + call_PhoneNumber + '], not needed Hangup');
	    }
	}	
	
	

	/*	5.A handle video add or remove	*/
	this.uiVideoDisplayEvent = function (b_local, b_added, _This) {
		var _this = _This.oCall;
    var o_elt_video = b_local ? (_this.videoLocal!=null?_this.videoLocal:null) : (_this.videoRemote!=null?_this.videoRemote:null);
		/*mod by Taurus.Feng 2014-06-20 notify outer media is OK*/
		var _This = cfManager;
    if (b_added) {
        if (SIPml.isWebRtc4AllSupported()) {
            if (b_local){ 
            if(window.__o_display_local_ex) {
            	window.__o_display_local_ex.style.visibility = "visible"; 
            	_this.hWnd = window.__o_display_local_ex;
            	_This.oUser.setCodeMsg(ret_code.CALL_MEDIA, b_local?"Add_Local":"Add_Remote", _this);
            	}}
            else { if(window.__o_display_remote_ex) {
            	window.__o_display_remote_ex.style.visibility = "visible"; 
            	_this.hWnd = window.__o_display_remote_ex;
            	_This.oUser.setCodeMsg(ret_code.CALL_MEDIA, b_local?"Add_Local":"Add_Remote", _this);
            	}} 
        }
        else {
            o_elt_video == null?null:o_elt_video.style.opacity = 1;
            o_elt_video == null?null:o_elt_video.style.visibility = "visible";
            o_elt_video == null?null:_This.oUser.setCodeMsg(ret_code.CALL_MEDIA, b_local?"Add_Local":"Add_Remote", _this);
        }
    }
    else {
        if (SIPml.isWebRtc4AllSupported()) {
        		if(_this.hWnd && o_elt_video ) {
        			_this.hWnd.removeNode();
        			_This.oUser.setCodeMsg(ret_code.CALL_MEDIA, b_local?"Del_Local":"Del_Remote", _this);
        		}
        }
        else{
            o_elt_video == null?null:o_elt_video.style.opacity = 0;
            o_elt_video == null?null:o_elt_video.style.visibility = "hidden";
            o_elt_video == null?null:o_elt_video.remove(); // = null;
            o_elt_video == null?null:_This.oUser.setCodeMsg(ret_code.CALL_MEDIA, b_local?"Del_Local":"Del_Remote", _this);
        }
        //fullScreen(false);
    }
	}
	
	/*	5.B create video tag	*/
	this.sipCreateVideoTag = function(divname, tag, nm, rand, w, h){
		// chrome
		if(!tsk_utils_have_webrtc4all()){
			var mydiv=document.getElementById(divname);
			var tVideo =document.createElement(tag);
			tVideo.class="video";
			if(typeof(globalUI) == "undefined") {
				tVideo.width = w?w:"640";
				tVideo.height = h?h:"480";
			}
			else {
				
			}
			tVideo.id="video_" + nm + '_' + rand;
			tVideo.autoplay="autoplay";
			tVideo.style.opacity = 0;
			tVideo.style.visibility = 'hidden';
			//tVideo.controls = "true";
			tVideo.muted = "false";
			//tVideo.onclick = this.toggleFullScreen; //add fullscreen
			mydiv.appendChild(tVideo);
			return tVideo;
		}
		else{
			var mydiv=document.getElementById(divname);
	    var div = document.createElement("div");
	    div.style.display = 'inline';
	    WebRtc4all_SetDisplays((nm=='local'?div:null), (nm=='remote'?div:null), rand, w, h);
	    mydiv.appendChild(div);
	    
		return div;
		}
	}
	
	/*	5.C create video size	*/
	this.getImageResolution = function(){
		var radioImage = document.getElementsByName("Image_resolution");
		var ImageResolution;
		for(var i=0; i<radioImage.length; ++i){
			if(radioImage[i].checked){
				if(!tsk_utils_have_webrtc4all()){
					switch(radioImage[i].value){
						case 'VGA':
							ImageResolution = '{ minWidth:640, minHeight:480, maxWidth:1920, maxHeight:1080 }';
						break;
						case '720p':
							ImageResolution = '{ minWidth:1280, minHeight:720, maxWidth:1920, maxHeight:1080 }';
						break;
						case '1080p':
							ImageResolution = '{ minWidth:1920, minHeight:1080, maxWidth:1920, maxHeight:1080 }';
						break;
						default:
							ImageResolution = '{ minWidth:640, minHeight:480, maxWidth:1920, maxHeight:1080 }';
						break;
					}
					return ImageResolution;
				}else{
					WebRtc4all_SetParameter("ImageResolution", radioImage[i].value);
				}
			}
		}
	}
	
	
	
	var fullScreen = function(b_fs, videoTag) {
		//var videoT = videoTag.target.parentElement.parentElement.firstElementChild;
		var videoT = videoTag.target;
		videoTag.bFullScreen = b_fs;
		if (tsk_utils_have_webrtc4native() && videoTag.bFullScreen && videoT.webkitSupportsFullscreen) {
			if (videoTag.bFullScreen) {
				videoT.webkitEnterFullScreen();
			}
			else {
				videoT.webkitExitFullscreen();
			}
		}
		else {
			if (tsk_utils_have_webrtc4npapi()) {
				try { if(window.__o_display_remote) window.__o_display_remote.setFullScreen(b_fs); }
				catch (e) { videoTag.setAttribute("class", b_fs ? "full-screen" : "normal-screen"); }
			}
			else {
				videoTag.setAttribute("class", b_fs ? "full-screen" : "normal-screen");
			}
		}
	}
	
	/* 5.D control video fullScreen */
	this.toggleFullScreen = function(videoTag) {
		// var videoT = videoTag.target.parentElement.parentElement.firstElementChild;
		var videoT = videoTag.target;
		if (videoT.webkitSupportsFullscreen) {
			fullScreen(!videoT.webkitDisplayingFullscreen, videoTag);
		}
		else {
			fullScreen(!videoTag.bFullScreen, videoTag);
		}
	}
	
	var createDivButton = function(pDiv, i, v, c) {
		var btnFull = document.createElement('input');
		btnFull.type = 'button';
		btnFull.id = i;
		btnFull.value = v;
		btnFull.onclick = c;
		pDiv.appendChild(btnFull);
	}
	/*	5.B create video tag	*/
	this.sipCreateVideoTagEx = function(divname, tag, nm, rand, w, h){
		// chrome
		if(!tsk_utils_have_webrtc4all()){
			var mydiv=document.getElementById(divname);
			var tVideo =document.createElement(tag);
			tVideo.class="video";
			tVideo.width = w?w:"640";
			tVideo.height = h?h:"480";
			tVideo.id="video_" + nm + '_' + rand;
			tVideo.autoplay="autoplay";
			tVideo.style.opacity = 0;
			tVideo.style.visibility = 'hidden';
			//tVideo.controls = "true";
			//tVideo.muted = "false";
			mydiv.appendChild(tVideo);
			
			// control full etc
			var bDiv = document.createElement('div');
			
			createDivButton(bDiv, 'btnFullScreen'+rand, 'FullScreen', this.toggleFullScreen);
			createDivButton(bDiv, 'btnHoldResume'+rand, 'Hold', this.toggleFullScreen);
			createDivButton(bDiv, 'btnHandup'+rand, 'Handup', this.toggleFullScreen);
			mydiv.appendChild(bDiv);	
			return tVideo;
		}
		else{
			var mydiv=document.getElementById(divname);
	    var div = document.createElement("div");
	    div.style.display = 'inline';
	    WebRtc4all_SetDisplays((nm=='local'?div:null), (nm=='remote'?div:null), rand, w, h);
	    mydiv.appendChild(div);
	    
		return div;
		}
	}

	/*====================check devices begin===========================*/
	
	devices_info = {
		CB_RECORD: 1,
		CB_DEVICES: 2,
		audio_context: undefined,
		recorder: undefined,
		videoSource: undefined,
		videoStream: undefined,
		posV: 0,
		audioSource: undefined,
		audioStream: undefined,
		posA: 0,
		device_index: 0,
		callback: undefined,
		inited: false
	}
	this.checkInit = function(callback) {

		try {

			devices_info.videoSource = new Array();
			devices_info.videoStream = new Array();
			devices_info.audioSource = new Array();
			devices_info.audioStream = new Array();
			devices_info.audio_context = new AudioContext;
			devices_info.posV = 0;
			devices_info.posA = 0;
			devices_info.callback = callback || undefined;
			
			if(devices_info.callback === undefined) {
				console.log("Please setup callback parameter for check devices");
			}

			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
			window.AudioContext = window.AudioContext || window.webkitAudioContext;	
			console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));

		} catch(e) {
			console.log('No web audio support in this browser!');
		}
		

		if (typeof MediaStreamTrack === 'undefined'){
			console.log('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
		} else {
            if( MediaStreamTrack.getSources)
                MediaStreamTrack.getSources(gotDevicesSources);
            else 
                navigator.mediaDevices.enumerateDevices().then(gotDevicesSources);
			devices_info.inited = true;
		}

	}

	this.updateDevices = function(callback) {

		if (typeof MediaStreamTrack === 'undefined'){
			console.log('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
		} else if(devices_info.inited) {

			var update_callback = callback;
			MediaStreamTrack.getSources(function(sourceInfos) {
				devices_info.audioSource = [];
				devices_info.videoSource = [];
				devices_info.posA = 0;
				devices_info.posV = 0;
				for (var index = 0; index != sourceInfos.length; ++index) {

		  		var sourceInfo = sourceInfos[index];
			  	if (sourceInfo.kind === 'audio') {

			  		devices_info.audioSource[devices_info.posA] = sourceInfo.id;
			    	console.log('video source: ', devices_info.audioSource[devices_info.posA]);
			    	devices_info.posA++;

			  	} else if (sourceInfo.kind === 'video') {

			    	devices_info.videoSource[devices_info.posV] = sourceInfo.id;
			    	console.log('video source: ', devices_info.videoSource[devices_info.posV]);
			    	devices_info.posV++;

			  	} else {
			    	console.log('Some other kind of source: ', sourceInfo);
			  	}
			}
			if(update_callback !== undefined) {
				update_callback(devices_info.CB_DEVICES, 
					{'video': devices_info.videoSource, 'audio': devices_info.audioSource});
			}

			});
		} else {
			console.log('Please first call function checkinit().');
		}
	}

	var successCallback = function(stream, element, index) {
		console.log("check getusermedia success " + element);
		element.src = window.URL.createObjectURL(stream);
		element.play();
		devices_info.videoStream[index] = stream;
	}

	var errorCallback = function(error, element) {
		console.log(element + 'No live input stream: ' + e);
	}

	var createDownloadLink = function() {
		devices_info.recorder && devices_info.recorder.exportWAV(function(blob) {
		      var url = URL.createObjectURL(blob);
		      devices_info.callback(devices_info.CB_RECORD, {'url': url});
	    });
	}

	var successCallbackRecord = function(stream, element, time, index) {
		console.log("check getusermedia success " + element);
		var input = devices_info.audio_context?devices_info.audio_context.createMediaStreamSource(stream):null;
		if(input === null) {
			console.log("audio context not all right!");
			return;
		}
		// Uncomment if you want the audio to feedback directly
    	input.connect(devices_info.audio_context.destination);
    	devices_info.recorder = new Recorder(input);
    	devices_info.recorder && devices_info.recorder.record(); // recording
	devices_info.audioStream[index] = stream;

    	setTimeout(function() {
    		devices_info.recorder && devices_info.recorder.stop();
    		createDownloadLink();
    		devices_info.recorder.clear();
    	}, time || 10000); 
	}

	var gotDevicesSources = function(sourceInfos) {
		for (var index = 0; index != sourceInfos.length; ++index) {

	  		var sourceInfo = sourceInfos[index];
		  	if (sourceInfo.kind === 'audio' || sourceInfo.kind === 'audioinput') {
		  		devices_info.audioSource[devices_info.posA] = sourceInfo.id;
		    	console.log('video source: ', devices_info.audioSource[devices_info.posA]);
		    	devices_info.posA++;

		  	} else if (sourceInfo.kind === 'video' || sourceInfo.kind === 'videoinput') {

		    	devices_info.videoSource[devices_info.posV] = sourceInfo.id;
		    	console.log('video source: ', devices_info.videoSource[devices_info.posV]);
		    	devices_info.posV++;

		  	} else {
		    	console.log('Some other kind of source: ', sourceInfo);
		  	}
		}
		if(devices_info.callback !== undefined) {
			devices_info.callback(devices_info.CB_DEVICES, 
				{'video': devices_info.videoSource, 'audio': devices_info.audioSource});
		}
	}

	this.closeCamera = function(index, type) {
		if(type == "video" && index >= 0 && devices_info.videoStream.length > index) {
			var stream = devices_info.videoStream[index];
			stream.stop();
			stream.onended = null;
			stream = null;
		}
		if(type == "audio" && index >= 0 && devices_info.audioStream.length > index) {
			var stream = devices_info.audioStream[index];
		        stream.stop();
			stream.onended = null;
                        stream = null;
		}
	}

	this.checkCamera = function(element, device_index) {

		var o_constraints = {
		    mandatory: { },
		    optional: [{sourceId: device_index<devices_info.videoSource.length?devices_info.videoSource[device_index]:devices_info.videoSource[0]}]
		};

		navigator.getUserMedia({video: o_constraints}, function(stream) {
			//successCallback(stream, element);
			successCallback(stream, element, device_index);
		}, function(e) {
	      errorCallback(e, element);
	    });
	}

	this.checkMicrophone = function(element, device_index, time) {

		var o_constraints = {
		    mandatory: { },
		    optional: [{sourceId: device_index<devices_info.audioSource.length?devices_info.audioSource[device_index]:devices_info.audioSource[0]}]
		};

		navigator.getUserMedia({audio: o_constraints}, function(stream) {
			successCallbackRecord(stream, element, time, device_index);
		}, function(e) {
	      errorCallback(e, element);
	    });
	}
	this.checkSpreaker = function() {

	}
	/*====================check devices end=============================*/

	
	/* ==================inner user ========================*/
	/* 6.A global enmu init */
	var _postInit = function(){
    
    // add app init callback , to plant register
    _This.b_initialized = ret_code.STACK_ING;
    _This.cbMsgInfo(ret_code.STACK_ING, 'inited');
    tsk_utils_log_info('cfManager>>>Global Environment inited ...');
	};
	
	
	/* 6.B Callback function for SIP Stacks */
	this._onSipEventStack = function(e /*SIPml.Stack.Event*/){
		tsk_utils_log_info('==stack event = ' + e.type + '->' + e.description);
		// var _This = cfManager; // global manager instance
		var _This_user = _This.oUser;
    switch (e.type) {
        case 'started':
            {
                // catch exception for IE (DOM not ready)
                try {
                    // LogIn (REGISTER) as soon as the stack finish starting
                    if(_This_user)
                    	_This_user.Register(this /*SIPml.Stack*/);
                }
                catch (e) {
                		if(_This_user)
                			_This_user.setCodeMsg(ret_code.REG_FAIL, "<i>" + e.description + "</i>", e);
                }
                break;
            }
        case 'stopping': case 'stopped': case 'failed_to_start': case 'failed_to_stop':
            {
                var bFailure = (e.type == 'failed_to_start') || (e.type == 'failed_to_stop');
                
                if(e.type == 'stopped'){
                	// bfSIPml.unCallAll();
                }
                
                if(_This.oUser && _This.oUser.oSipSessionRegister == null) {
                	_This.oUser.oSipStack = null;
                	_This.oUser.oRoomList.removeAll(); // all room delete
								}
                _stopRingbackTone();
                _stopRingTone();

                var InfoRegStatus = bFailure ? "<i>Disconnected: <b>" + e.description + "</b></i>" : "<i>Disconnected</i>";
                _This_user.setCodeMsg(ret_code.UNREG_OK, InfoRegStatus, e);
                
                break;
            }

        case 'i_new_call':
            {
            		var oSipSessionCall = null;
                if (oSipSessionCall) {
                    // do not accept the incoming call if we're already 'in call'
                    e.newSession.hangup(); // comment this line for multi-line support
                }
                else {
                    oSipSessionCall = e.newSession;
                    // start listening for events
                    oSipSessionCall.setConfiguration(_This_User.oConfigP);

                    _startRingTone();

                    var sRemoteNumber = (oSipSessionCall.getRemoteFriendlyName() || 'unknown');
                    _This.cbMsgInfo(ret_code.CALL_INCOME, "<i>Incoming call from [<b>" + sRemoteNumber + "</b>]</i>");
                }
                break;
            }
        case 'i_new_message':
        		{
        			
        			
								var oSipMsgSession = null;
								if(oSipMsgSession = _This_user.buddy_mgr.getBuddyInfoHead(e)) {
									_This_user.buddy_mgr.handleBuddyInfo(e, oSipMsgSession);
								} else {
							
	        				var oSipSessionMessageCome = e.newSession;	
	        				// start listening for events
	                oSipSessionMessageCome.setConfiguration({events_listener: { events: '*', listener: _This._onSipEventSession }});
	                
	                tsk_utils_log_info(tsk_buff_u8b2ascii(e.o_event.o_message.o_content));
	                var from = e.o_event.o_message.o_hdr_From;
	                var message = {'from': from.s_display_name?from.s_display_name:from.o_uri.s_user_name, 'content': tsk_buff_u8b2ascii(e.o_event.o_message.o_content)};
	                _This.cbMsgInfo(ret_code.IM_INCOME, 'coming message', message);
              	}
        				break;
        		}
				/* add by Taurus.Feng 2014-05-20 create sip info for get conference list */
        case 'i_new_info':
        		{
        			tsk_utils_log_info('New info coming now ...');
        			
        			var oSipInfoSession = null;
        			if(oSipInfoSession = _This_user.buddy_mgr.getBuddyInfoHead(e)) {
								_This_user.buddy_mgr.handleBuddyInfo(e, oSipInfoSession);
							} 
							else {
        			var oSipSessionInfo = e.newSession;	
      				// start listening for events
              oSipSessionInfo.setConfiguration({events_listener: { events: '*', listener: _This._onSipEventSession }});
              
              /* add by Taurus.Feng 2014-06-03 accept incoming SIP info */
              var jsonObject = JSON.parse(e.getContentString());
              tsk_utils_log_info("INFO: " + e.getContentType() + ":" + tsk_buff_u8b2ascii(e.o_event.o_message.o_content));
              _This_user.room_mgr.handleInfo(e);
              
              oSipSessionInfo = null;
            	}
              break; 
        		}
        case 'm_permission_requested':
            {
            		_This.cbMsgInfo(ret_code.CALL_ING, e.description);
                break;
            }
        case 'm_permission_accepted':
        case 'm_permission_refused':
            {
                if(e.type == 'm_permission_refused'){
                  //oSipSessionCall = null;
                  _This.cbMsgInfo(ret_code.MEDIA_REJECT, e.description, e);
							    _stopRingbackTone();
							    _stopRingTone();
                } else {
                	_This.cbMsgInfo(ret_code.MEIDA_ACCEPT, e.description, e);
                }
                break;
            }

        case 'starting': default: break;
    }                  
	};
	
	/* 6.C Callback function for SIP sessions (INVITE, REGISTER, MESSAGE...) */
	this._onSipEventSession = function(e /* SIPml.Session.Event */) {
    tsk_utils_log_info('==session event = ' + e.type + '->' + e.description);
    var _This_user = _This.oUser; // register user
		var oSipCallSessionOne = null; // oSipCallSessionOne.oCall.o_SipSessionCall
    switch (e.type) {
        case 'connecting': case 'connected':
            {
                var bConnected = (e.type == 'connected');
                if (e.session == _This_user.oSipSessionRegister) {
                		//callback to user set status or send msg
                    _This_user.setCodeMsg((bConnected?ret_code.REG_OK:ret_code.REG_ING), "<i>" + e.description + "</i>", e);
                }
                else if ( oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {

                    if (bConnected) {
                        _stopRingbackTone();
                        _stopRingTone();
                    }
                   	// performance test analysis
                    if(_This.isPerfTest){
                    	// 500ms delay pause
                    	if(bConnected && SIPml.isWebRtc4AllSupported() && curr_mode == EVC.Constant.video_mode_delay){ // remove to outer layer
                    	setTimeout(function(){
                    			oSipCallSessionOne.oCall.stop();
                    		}, 500);
                    	}
                    	oSipCallSessionOne.oCall.perfVideo.on_sip_event(e);
                    }
                    else{
                    	//callback to mgr call set status or send msg
                    	oSipCallSessionOne.setCodeMsg(bConnected?ret_code.CALL_OK:ret_code.CALL_ING, "<i>" + e.description + "</i>", oSipCallSessionOne.oCall);
                    }
                    
                    if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback
                        _This.uiVideoDisplayEvent(true, true, oSipCallSessionOne);
                        _This.uiVideoDisplayEvent(false, true, oSipCallSessionOne);
                    }
                }
                break;
            } // 'connecting' | 'connected'
        case 'terminating': case 'terminated':
            {
            		var bTerminated = (e.type == 'terminated');
                if (e.session == _This_user.oSipSessionRegister) {
                		// release room
                   	_This_user.UnRegister();
                    // if(bTerminated)
                    _This_user.oSipSessionRegister = null;
                    
										_This_user.setCodeMsg((bTerminated?ret_code.UNREG_OK:ret_code.UNREG_ING), "<i>" + e.description + "</i>", e);
                }
                else if ( oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
                    // performance test analysis
                    if(_This.isPerfTest){
                    	oSipCallSessionOne.oCall.perfVideo.on_sip_event(e);
                    }
                    else{
                    	oSipCallSessionOne.setCodeMsg(bTerminated?ret_code.HANGUP_OK:ret_code.HANGUP_ING, e.description, oSipCallSessionOne.oCall);
                    }
                    
                    // not all release, so from bTerminated to 1
                    if(1) { // server callback BYE, only terminated, not termining, so bTerminated handle video tag
                    	_This.uiVideoDisplayEvent(true, false, oSipCallSessionOne);
                   		_This.uiVideoDisplayEvent(false, false, oSipCallSessionOne);
                   		
                   		 // delete one session
											_This_user._sipSessionCallDelete(oSipCallSessionOne.oCall, true);
											oSipCallSessionOne = null;
									    
									    _stopRingbackTone();
									    _stopRingTone();
                  	}
                   
                    
                }
                else if(e.session == _This_user.room_mgr.oSipSessionMessage){
                		_This_user.room_mgr.oSipSessionMessage = null;
                }
                else if(oSipCallSessionOne= _This_user._sipSessionRoomInfo(e.session)){
                		//_This_user.room_mgr.oSipSessionInfo = null;
                		oSipCallSessionOne.oSipSessionInfo = null;
                }
                
                break;
            } // 'terminating' | 'terminated'

	case 'cancelled_request':
	    {
		if (e.session == _This_user.oSipSessionRegister) {
			tsk_utils_log_info("*******register expires cancelled********");
			_This_user.setCodeMsg(ret_code.REG_EXPIRES, "<i>" + e.description + "</i>", e);
		}
	    } // cancelled_request

        case 'm_stream_video_local_added':
            {
            		if (oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
                    // performance test analysis
	                	if(_This.isPerfTest){
	            				oSipCallSessionOne.oCall.perfVideo.on_sip_event(e);
										}else {
                    	_This.uiVideoDisplayEvent(true, true, oSipCallSessionOne);
                  	}
                }

                break;
            }
        case 'm_stream_video_local_removed':
            {
                if (oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
                    // performance test analysis
	                	if(_This.isPerfTest){
	            				oSipCallSessionOne.oCall.perfVideo.on_sip_event(e);
										}else {
                    	_This.uiVideoDisplayEvent(true, false, oSipCallSessionOne);
                  	}
                }
                break;
            }
        case 'm_stream_video_remote_added':
            {
            		
                if (oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
                		// performance test analysis
	                	if(_This.isPerfTest){
	            				oSipCallSessionOne.oCall.perfVideo.on_sip_event(e);
										}else {
                    	_This.uiVideoDisplayEvent(false, true, oSipCallSessionOne);
                  	}
                }
                break;
            }
        case 'm_stream_video_remote_removed':
            {
            		if (oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
                    // performance test analysis
	                	if(_This.isPerfTest){
	            				oSipCallSessionOne.oCall.perfVideo.on_sip_event(e);
										}else {
                    	_This.uiVideoDisplayEvent(false, false, oSipCallSessionOne);
                  	}
                }
                break;
            }

        case 'm_stream_audio_local_added':
        case 'm_stream_audio_local_removed':
        		{
        				if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
            			var isAudio = (oSipCallSessionOne.type == "call-audio");
									if(isAudio) {
            				if('m_stream_audio_local_added' == e.type)
            					_This_user.setCodeMsg(ret_code.CALL_MEDIA, "Add_Local", oSipCallSessionOne.oCall);
            				else
            					_This_user.setCodeMsg(ret_code.CALL_MEDIA, "Del_Local", oSipCallSessionOne.oCall);
            			}
            		}
                break;
        		}
        case 'm_stream_audio_remote_added':
        case 'm_stream_audio_remote_removed':
            {
            		if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
            			var isAudio = (oSipCallSessionOne.type == "call-audio");
            			var isRemoteAudio = (isAudio && oSipCallSessionOne.oCall && oSipCallSessionOne.oCall.audioRemote);
            			if(isAudio && isRemoteAudio) {
            				if('m_stream_audio_remote_added' == e.type)
            					_This_user.setCodeMsg(ret_code.CALL_MEDIA, isRemoteAudio?"Add_Remote":"NOTING", oSipCallSessionOne.oCall);
            				else
            					_This_user.setCodeMsg(ret_code.CALL_MEDIA, isRemoteAudio?"Del_Remote":"NOTING", oSipCallSessionOne.oCall);
            			}
            		}
                break;
            }

        case 'i_ect_new_call':
            {
                oSipSessionTransferCall = e.session;
                break;
            }
				case 'i_notify':
				{
						/* buddy manage, add buddy By Taurus.Feng.2014-09-15*/
						if(oSipCallSessionOne = _This_user.buddy_mgr.getBuddyInfoSession(e.session)) {
								_This_user.buddy_mgr.handleBuddyInfo(e, oSipCallSessionOne);
						}
						break;
				}
				case 'get_lo_failed':
						{
							tsk_utils_log_info('******set ro failed******');
							if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
            			_This_user.setCodeMsg(ret_code.CALL_LOFAIL, "get local sdp FAIL", oSipCallSessionOne.oCall);
            	}
						}
						break;
				case 'set_ro_failed':
						{
							tsk_utils_log_info('******set ro failed******');
							if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)) {
            			_This_user.setCodeMsg(ret_code.CALL_ROFAIL, "set remote sdp FAIL", oSipCallSessionOne.oCall);
            	}
						}
						break;
        case 'i_ao_request':
            {
            		
								/* buddy manage, add buddy By Taurus.Feng.2014-09-15*/
								if(oSipCallSessionOne = _This_user.buddy_mgr.getBuddyInfoSession(e.session)) {
										_This_user.buddy_mgr.handleBuddyInfo(e, oSipCallSessionOne);
								}
                else if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                    var iSipResponseCode = e.getSipResponseCode();
                    if (iSipResponseCode == 180 || iSipResponseCode == 183) {
                        _startRingbackTone();
                        oSipCallSessionOne.setCodeMsg(ret_code.CALL_SEND, '<i>Remote ringing...</i>', oSipCallSessionOne.oCall);
                    }
                    else if(iSipResponseCode == 100) {
                    	;
                    }
                    else {// if(iSipResponseCode == 404) {
                    		tsk_utils_log_info('*******call error ' + e.type + '->' + e.description);
                    		_This_user.room_mgr.setCodeMsg(ret_code.CALL_ERROR, '<i> Call ERROR</i>', oSipCallSessionOne.oCall);
                    }
                }
                else if(oSipCallSessionOne = ((_This_user.room_mgr.sessionInfo===e.session)?_This_user.room_mgr.sessionInfo:(_This_user._sipSessionRoomInfo(e.session)))){
                	if(e.getContentType() === 'application/json' && e.getSipResponseCode() == 200){
                		// 200 OK response meeting info etc
                		_This_user.room_mgr.handleInfo(e);

                	} else {
                		_This.cbMsgInfo(ret_code.SIP_INFO, 'room ['+oSipCallSessionOne.room_id+']Recv SIP Info Code ['+e.getSipResponseCode()+']');
                	}
                	//_This_user.room_mgr.oSipSessionInfo = null;
                }
                else if(e.session == _This_user.room_mgr.oSipSessionMessage){
                		tsk_utils_log_info('SIP Message: content_type['+e.getContentType()+'],resp_code['+e.getSipResponseCode()+']');
                }
                break;
            }

        case 'm_early_media':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		/*add by Taurus.Feng 2014.06.17 recvied 200-OK sourceid oSipCallSessionOne.oCall.source_id*/
                    oSipCallSessionOne.setSourceId(e);
                    
                    _stopRingbackTone();
                    _stopRingTone();
                }
                break;
            }

        case 'm_local_hold_ok':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                    if (oSipSessionCall.bTransfering) {
                        oSipSessionCall.bTransfering = false;
                        // this.AVSession.TransferCall(this.transferUri);
                    }
                    btnHoldResume.value = 'Resume';
                    btnHoldResume.disabled = false;
                    oSipSessionCall.bHeld = true;
                    _This.cbMsgInfo(200, '<i>Call placed on hold</i>');
                }
                break;
            }
        case 'm_local_hold_nok':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                    oSipSessionCall.bTransfering = false;
                    btnHoldResume.value = 'Hold';
                    btnHoldResume.disabled = false;
                    _This.cbMsgInfo(200, '<i>Failed to place remote party on hold</i>');
                }
                break;
            }
        case 'm_local_resume_ok':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                    oSipSessionCall.bTransfering = false;
                    btnHoldResume.value = 'Hold';
                    btnHoldResume.disabled = false;
                    _This.cbMsgInfo(200, '<i>Call taken off hold</i>');
                    oSipSessionCall.bHeld = false;

                    if (SIPml.isWebRtc4AllSupported()) { // IE don't provide stream callback yet
                        _This.uiVideoDisplayEvent(true, true, e.session);
                        _This.uiVideoDisplayEvent(false, true, e.session);
                    }
                }
                break;
            }
        case 'm_local_resume_nok':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                    oSipSessionCall.bTransfering = false;
                    btnHoldResume.disabled = false;
                    _This.cbMsgInfo(200, '<i>Failed to unhold call</i>');
                }
                break;
            }
        case 'm_remote_hold':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		_This.cbMsgInfo(200, '<i>Placed on hold by remote party</i>');
                }
                break;
            }
        case 'm_remote_resume':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                	  _This.cbMsgInfo(200, '<i>Taken off hold by remote party</i>');
                }
                break;
            }

        case 'o_ect_trying':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		_This.cbMsgInfo(200, '<i>Call transfer in progress...</i>');
                }
                break;
            }
        case 'o_ect_accepted':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		_This.cbMsgInfo(200, '<i>Call transfer accepted</i>');
                }
                break;
            }
        case 'o_ect_completed':
        case 'i_ect_completed':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		_This.cbMsgInfo(200, '<i>Call transfer completed</i>');
                    btnTransfer.disabled = false;
                    if (oSipSessionTransferCall) {
                        oSipSessionCall = oSipSessionTransferCall;
                    }
                    oSipSessionTransferCall = null;
                }
                break;
            }
        case 'o_ect_failed':
        case 'i_ect_failed':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		_This.cbMsgInfo(200, '<i>Call transfer failed</i>');
                    btnTransfer.disabled = false;
                }
                break;
            }
        case 'o_ect_notify':
        case 'i_ect_notify':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){
                		_This.cbMsgInfo(200, "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>");                   
                    if (e.getSipResponseCode() >= 300) {
                        if (oSipSessionCall.bHeld) {
                            oSipSessionCall.resume();
                        }
                        btnTransfer.disabled = false;
                    }
                }
                break;
            }
        case 'i_ect_requested':
            {
                if(oSipCallSessionOne = _This_user._sipSessionCallExist(e.session)){                        
                    var s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?";//FIXME
                    if (confirm(s_message)) {
                        _This.cbMsgInfo(200, '<i>Call transfer in progress...</i>');
                        oSipSessionCall.acceptTransfer();
                        break;
                    }
                    oSipSessionCall.rejectTransfer();
                }
                break;
            }
    }
	};
	
	var _startRingTone = function() {
    try { ringtone.play(); }
    catch (e) { }
	}
	
	var _stopRingTone = function() {
	    try { ringtone.pause(); }
	    catch (e) { }
	}
	
	var _startRingbackTone = function() {
	    try { ringbacktone.play(); }
	    catch (e) { }
	}
	
	var _stopRingbackTone = function() {
	    try { ringbacktone.pause(); }
	    catch (e) { }
	}
}
conference_manager.prototype.oReadyStateTimer = null;

/*======================base class session: global object or sip msg interface==============================*/
function confer_mgr_session(_This) {
	this.oInstance = _This;
	this.oUser = this.oInstance && this.oInstance.oUser;
	this.oSipStack = this.oUser && this.oUser.oSipStack;
	
	this.setStack = function(_This) {
		this.oUser = _This;
		this.oSipStack = _This.oSipStack;
	}
	
	var head_type = {
		SUBSCRIBE: { name: 'Accept', value: 'application/pidf+xml' },
		INFO:	null
	};
	var setHeadExtend = function(m, ht, hdr) {
		var head = []; //[{name: 'What', value: m?m:'Sending ...'}];
		if(ht && typeof ht != undefined) 
			head.push(ht);
		if(!hdr || (typeof hdr == undefined) || !(hdr instanceof Array))
			return;
		for(var i=0; i<hdr.length; i++) {
			head.push(hdr[i]);
		}
		return head;              
	}
	
	/* send sip INVITE*/
	this._sipOneCall = function (s_type, call_PhoneNumber, o_ConfigCall) {
		
		if(this.oConfigP) {
			o_ConfigCall.bandwidth 	= (o_ConfigCall.et_bandwidth ? tsk_string_to_object(o_ConfigCall.et_bandwidth) : null); // already defined at stack-level but redifined to use latest values
			o_ConfigCall.video_size = (o_ConfigCall.et_video_size ? tsk_string_to_object(o_ConfigCall.et_video_size) : null); // already defined at stack-level but redifined to use latest values
			o_ConfigCall.events_listener = { events: '*', listener: this.oInstance._onSipEventSession };
			o_ConfigCall.sip_caps = [
			{ name: '+g.oma.sip-im' },
			{ name: '+sip.ice' },
			{ name: 'language', value: '\"en,fr\"' },
			]
		}

		var o_SipSessionCall = this.oSipStack.newSession(s_type, o_ConfigCall);

		// make call
		if (o_SipSessionCall.call(call_PhoneNumber) != 0) {
			o_SipSessionCall = null;
			this.oInstance.cbMsgInfo(ret_code.SIP_INVITE, 'Failed to make call');
			return null;
		}
		else{
			return o_SipSessionCall;		
		}
	};
	
	/* send sip INFO 	*/
	this._sipInfoSend = function(to_number, to_message, s_content_type, hdr){
		var s_content_type = s_content_type?s_content_type:'text/plain;charset=utf-8';
		if(this.oSipStack /*&& !this.oSipSessionInfo*/){
				if(tsk_string_is_null_or_empty(to_number) ){
						this.oInstance.cbMsgInfo(ret_code.SIP_INFO, '<i>to Number is empty!  Please Input</i>');
						return -1;
				}
				if(0 && tsk_string_is_null_or_empty(to_message)){
						this.oInstance.cbMsgInfo(ret_code.SIP_INFO, '<i>to Message Info is empty!  Please ReInput</i>');
						return -1;
				}
				
				var head = setHeadExtend('Sending Info', null /*head_type.INFO*/, hdr);
				// create Message session
				var oSipSessionInfo = this.oSipStack.newSession('info', {
					events_listener: { events: '*', listener: this.oInstance._onSipEventSession },
					sip_caps: [               
											{ name: '+g.oma.sip-im' },
                      { name: '+sip.ice' },
                      { name: 'language', value: '\"en,fr\"' }],
    			sip_headers: head
					});
				// send sip INFO
				oSipSessionInfo.send(to_number, to_message, s_content_type, {events_listener: { events: '*', listener: this.oInstance._onSipEventSession }});
				return oSipSessionInfo;
		} /*
		else if(this.oSipSessionInfo){
				this.oSipSessionInfo.send(to_number, to_message, s_content_type, {events_listener: { events: '*', listener: this.oInstance._onSipEventSession }});
		} */
	}
	
	
	/*  send sip SUBSCRIBE*/
	this._sipSubscribeSend = function(to_number, hdr, exp){
		if(this.oSipStack){
				if(tsk_string_is_null_or_empty(to_number) ){
						this.oInstance.cbMsgInfo(ret_code.SIP_INFO, '<i>to Number is empty!  Please Input</i>');
						return -1;
				}
				
				var head = setHeadExtend('Sending Subscribe', head_type.SUBSCRIBE, hdr);
				// create Message session
				var oSipSession = this.oSipStack.newSession('subscribe', {
					events_listener: { events: '*', listener: this.oInstance._onSipEventSession },
					expires: exp?exp:200,
					sip_caps: [               
											{ name: '+g.oma.sip-im' },
                      { name: '+sip.ice' },
                      { name: 'language', value: '\"en,fr\"' }],
    			sip_headers: head
					});
				// send sip INFO
				oSipSession.subscribe(to_number, {events_listener: { events: '*', listener: this.oInstance._onSipEventSession }});
				return oSipSession;
		} 
	}
	
	/*  send sip PUBLISH*/
	this._sipPublishSend = function(to_number, content_type, hdr, exp){
		if(this.oSipStack){
				if(tsk_string_is_null_or_empty(to_number) ){
						this.oInstance.cbMsgInfo(ret_code.SIP_INFO, '<i>to Number is empty!  Please Input</i>');
						return -1;
				}
				if(tsk_string_is_null_or_empty(content_type)){
						this.oInstance.cbMsgInfo(ret_code.SIP_INFO, '<i>to Message Info is empty!  Please ReInput</i>');
						return -1;
				}
				
				// create Message session
				var oSipSession = this.oSipStack.newSession('publish', {
					events_listener: { events: '*', listener: this.oInstance._onSipEventSession },
					expires: exp?exp:200,
					sip_caps: [               
											{ name: '+g.oma.sip-im' },
                      { name: '+sip.ice' },
                      { name: 'language', value: '\"en,fr\"' }],
    			sip_headers: [
                      { name: 'What', value: 'Sending Subscribe' },
                      { name: 'My-Organization', value: 'Doubango Telecom' },
                      { name: 'Accept', value: 'application/pidf+xml' },
                      hdr?hdr:""
                      ]
					});
				// send sip INFO
				oSipSession.publish(to_number, content_type, {events_listener: { events: '*', listener: this.oInstance._onSipEventSession }});
				return oSipSession;
		} 
	}
	
	/*	send sip MESSAGE 	*/
	this._sipIMSend = function(im_number, im_message, s_content_type){
	
		var s_content_type = s_content_type?s_content_type:'text/plain;charset=utf-8';
		if(this.oSipStack /*&& !this.oSipSessionMessage*/){
				if(tsk_string_is_null_or_empty(im_number) ){
						this.oInstance.cbMsgInfo(ret_code.SIP_MESSAGE, '<i>IM Number is empty!  Please Input</i>');
						return -1;
				}
				if(tsk_string_is_null_or_empty(im_message)){
						this.oInstance.cbMsgInfo(ret_code.SIP_MESSAGE, '<i>IM Message Info is empty!  Please ReInput</i>');
						return -1;
				}
				
				// create Message session
				var oSipSessionMessage = this.oSipStack.newSession('message', {
					events_listener: { events: '*', listener: this.oInstance._onSipEventSession },
					sip_caps: [               
											{ name: '+g.oma.sip-im' },
                      { name: '+sip.ice' },
                      { name: 'language', value: '\"en,fr\"' }],
    			sip_headers: [
                      { name: 'What', value: 'Sending SMS' },
                      { name: 'My-Organization', value: 'Doubango Telecom' }]
					});
				// IM send
				oSipSessionMessage.send(im_number, im_message, s_content_type, {events_listener: { events: '*', listener: this.oInstance._onSipEventSession }});
				return oSipSessionMessage;
		} /*
		else if(this.oSipSessionMessage){
				// IM send
				this.oSipSessionMessage.send(im_number, im_message, s_content_type, {events_listener: { events: '*', listener: this._onSipEventSession }});
		}*/
	}
	
}

/*======================subs class user==============================*/
function confer_mgr_user(_This) {
	
	this.oInstance = _This; //global manager instance cfManager
	
	this.oSipStack = null;
	this.oSipSessionRegister = null;
	this.expires = 200;
	
	this.b_regStatus 	= ret_code.STATUS_NO;
	
	// is send join info
	this.isSendJoin = true;
	
	// room mgr
	this.room_mgr = new confer_mgr_room(_This);
	
	/* buddy manage, add buddy By Taurus.Feng.2014-09-15*/
	this.buddy_mgr = new buddy_list_manage(_This);
	
	// room list 
	this.oRoomList = new Map(); 
	
	var sipControlType = function() {
		var user_agent = navigator.userAgent ? navigator.userAgent.toLowerCase() : null;
		if(user_agent && (-1 != user_agent.indexOf("vccamp")))
			return "4";
		return "1";
	}
	this.init = function(oConfigP) {
		this.id_Realm = oConfigP.id_Realm || '*';
		this.id_PrivateIdentity = oConfigP.id_PrivateIdentity || null;
		this.id_PublicIdentity = oConfigP.id_PublicIdentity || null;
		this.id_Password = oConfigP.id_Password || null;
		this.id_DisplayName = oConfigP.id_DisplayName || null;
		this.et_websocket_server_url = oConfigP.et_websocket_server_url || null;
		this.et_sip_outboundproxy_url = oConfigP.et_sip_outboundproxy_url || null;
		this.et_ice_servers = (oConfigP.et_ice_servers&&(oConfigP.et_ice_servers instanceof Array)&&oConfigP.et_ice_servers.length&&oConfigP.et_ice_servers[0].url)?oConfigP.et_ice_servers:undefined;
		this.et_enable_rtcweb_breaker = oConfigP.et_enable_rtcweb_breaker || false;
		this.et_disable_early_ims = oConfigP.et_disable_early_ims || true;
		this.et_enable_media_caching = oConfigP.et_enable_media_caching || false;
		this.et_bandwidth = oConfigP.et_bandwidth || null;
		this.et_video_size = oConfigP.et_video_size || null;
		this.expires	= oConfigP.et_expires || 200;
		this.isSendJoin = (oConfigP.et_send_join != undefined && oConfigP.et_send_join == false) ? false:true;
		// Add by Taurus.Feng.reg_addr.2014.08.04 controlType: 1 sipml5, area: AS-CN-GD-GD
		this.controlType = sipControlType();
		this.area = oConfigP && oConfigP.et_Area_Isp ? oConfigP.et_Area_Isp : '3001';
		
		
		this.oConfigP = oConfigP;
		
		this.Validy();
	}
	
	this.Validy = function() {   	  
		// check Required parameters
		if (!this.id_Realm || !this.id_PrivateIdentity || !this.id_PublicIdentity) {
			this.b_regStatus 	= ret_code.REG_FAIL;
			this.oInstance.cbMsgInfo(ret_code.REG_FAIL, '<b>Please fill madatory fields (*)</b>');
			return;
		}
		var o_impu = tsip_uri.prototype.Parse(this.id_PublicIdentity);
		if (!o_impu || !o_impu.s_user_name || !o_impu.s_host) {
			this.b_regStatus 	= ret_code.REG_FAIL;
			this.oInstance.cbMsgInfo(ret_code.REG_FAIL, "<b>[" + this.id_PublicIdentity + "] is not a valid Public identity</b>");
			return;
		}
		// enable notifications if not already done
		if (window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
			window.webkitNotifications.requestPermission();
		}
		return;
	}
	
	this.CreateStack = function(sCb) {
		this.oSipStack = new SIPml.Stack({
			realm: this.id_Realm,
			impi: this.id_PrivateIdentity,
			impu: this.id_PublicIdentity,
			password: this.id_Password,
			display_name: this.id_DisplayName,
			websocket_proxy_url: (this.et_websocket_server_url ? this.et_websocket_server_url : null),
			outbound_proxy_url: (this.et_sip_outboundproxy_url ? this.et_sip_outboundproxy_url : null),
			ice_servers: (this.et_ice_servers ? this.et_ice_servers : null),
			enable_rtcweb_breaker: (this.et_enable_rtcweb_breaker ? this.et_enable_rtcweb_breaker : false),
			events_listener: { events: '*', listener: sCb?sCb:this.oInstance._onSipEventStack },
			enable_early_ims: (this.et_disable_early_ims ? this.et_disable_early_ims : true), // Must be true unless you're using a real IMS network
			enable_media_stream_cache: (this.et_enable_media_caching ? this.et_enable_media_caching  : false),
			bandwidth: (this.et_bandwidth ? tsk_string_to_object(this.et_bandwidth) : null), // could be redefined a session-level
			video_size: (this.et_video_size ? tsk_string_to_object(this.et_video_size) : null), // could be redefined a session-level
			sip_headers: [
				{ name: 'User-Agent', value: 'IM-client/OMA1.0 sipML5-v1.2013.08.10B' },
				{ name: 'Organization', value: 'EnjoyVC Telecom' },
				// Add by Taurus.Feng.reg_addr.2014.08.04 controlType: 1 sipml5, area: AS-CN-GD-GD
				{ name: 'Area', value: (this.area ? this.area : null)}, 
				{ name: 'Control-Type', value: this.controlType ? this.controlType : '1'},
			]
		});
		
		// set stack or oUser to mgr session
		this.room_mgr.setStack(this);
		this.buddy_mgr.setStack(this);
		return this.oSipStack;
	}
	
	this.setCodeMsg = function(Status, msg, session) {
			this.b_regStatus 	= Status;
			this.oInstance.cbMsgInfo(Status, msg, session); // 20140918 add session param out
			tsk_utils_log_info('cfManager>>>user status<'+Status+'> msg:'+msg);
	};
	
	this.Register = function(stack, sCb) {
		this.oSipSessionRegister = stack.newSession('register', {
			expires: this.expires || 200,
			events_listener: { events: '*', listener: sCb?sCb:this.oInstance._onSipEventSession },
			sip_caps: [
				{ name: '+g.oma.sip-im', value: null },
				{ name: '+audio', value: null },
				{ name: 'language', value: '\"en,fr\"' }
			],
		});
		this.oSipSessionRegister.register();
	}
	
	this.UnRegister = function() {
		// release all room send call
		this.MeetingLeaveAll();
		// release stack send unregister
		if (this.oSipStack) {
			this.oSipStack.stop(); // shutdown all sessions
		}
	}
	
	// leave all room
	this.MeetingLeaveAll = function() {
		for(var i=0; i<this.oRoomList.arr.length; ++i) {
			var room_id = this.oRoomList.arr[i].key;
			var to_number = this.oRoomList.arr[i].value.to;
			this.MeetingLeave(to_number, room_id);
		}
	}
	
	this.MeetingJoin = function(to_number, room_id) {
		// check room is exist?
		var room = this.oRoomList.get(room_id);
		if(room && room.status == ret_code.MEET_JOIN) {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] is always Join');
			return;
		}
		
		// not exist, so create
		if(!room) {
			room = this.room_mgr.NewRoom();
		}
		room.init(to_number, room_id);
		// join meet is need send join info
		if(this.isSendJoin) {
			this.room_mgr.JoinRoom(to_number, room_id, room); // send Join info
		} else {
			room.status = ret_code.MEET_JOIN;
		}
		this.oRoomList.put(room_id, room); //add room list
		tsk_utils_log_info('cfManager>>>room ['+room_id+'] add to list');
	}
	
	this.MeetingLeave = function(to_number, room_id) {
		var room = this.oRoomList.get(room_id);
		// room is not exist
		if(!room) {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] is Not Join');
			return;
		}
		// room is always leave
		if(room && room.status == ret_code.MEET_LEAVE) {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] is Not Join');
			return;
		}
		// bye all session
		this.room_mgr.byeCall(room);
		//
		// leave meet is need send leave info
		if(this.isSendJoin) {
			this.room_mgr.LeaveRoom(to_number, room_id, room);
		} else {
			room.status = ret_code.MEET_LEAVE;
		}
		//this.oRoomList.remove(room_id); //remove room list
	}

	
	this.MeetingCreate = function(to_number, room_id, nodes) {
		this.room_mgr.CreateRoom(to_number, room_id, nodes);
	}

	this.MeetingUpdate = function(to_number, room_id, nodes) {
		this.room_mgr.UpdateRoom(to_number, room_id, nodes);
	}
	
	this.MeetingDelete = function(to_number, room_id) {
		this.room_mgr.DeleteRoom(to_number, room_id);
	}
	
	this.MeetingPublishInfo = function(to_number, room_id) {
		// check room is exist?
		var room = this.oRoomList.get(room_id);
		if(!room || room.status != ret_code.MEET_JOIN) {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] is not Join');
			return;
		}
		
		this.room_mgr.GetPubInfoRoom(to_number, room_id, room);
	}
	
	this.MeetingPublishControl = function(to_number, room_id, a_type, a_source) {
		// check room is exist?
		var room = this.oRoomList.get(room_id);
		if(!room || room.status != ret_code.MEET_JOIN) {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] is not Join');
			return;
		}
		// disable/enable
		if(a_type != 'disable' && a_type != 'enable') {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] publish control param '+a_type+' not OK');
			return;
		}
		this.room_mgr.SendPublishCtl(to_number, room_id, a_type, a_source?a_source:'all', room)
	}
	
	this.MeetingSendIM = function(to_number, room_id, content) {
		// check room is exist?
		var room = this.oRoomList.get(room_id);
		if(0 && (!room || room.status != ret_code.MEET_JOIN)) {
			this.room_mgr.setCodeMsg(ret_code.MEET_OTHER, 'Meeting ['+room_id+'] is not Join');
			return;
		}
		
		this.room_mgr.SendIM(to_number, room_id, room, content);
	}
	
	/* buddy manage, add buddy By Taurus.Feng.2014-09-15
	** b_type : type for distinguish callback */
	this.BuddyManageInit = function(b_type, b_auto) {

		var scheme = {"buddyid": this.id_PrivateIdentity, "displayname": this.id_DisplayName, "group": "rootgroup"};
		
		if(b_type == buddy_type.RECENT_CONTANTS) {
			// init recent contants, first get recent list, after callback recent init
			tsk_utils_log_info("buddy>>>init recent contants...");
			this.buddy_mgr.buddyGet(this.id_Realm, scheme, oper_type.INIT_RECENT, oper_head.GET_LATEST_FRIEND);
		}
		else if (b_type == buddy_type.BUDDY_PARTNER){
			// init buddy partner, first get buddy list, after callback buddy init
			tsk_utils_log_info("buddy>>>init buddy partner...");
			this.buddy_mgr.buddyGetPartner(this.id_Realm, scheme, oper_type.INIT_BUDDY, oper_head.GET_FRIEND);
			
			if(b_auto) {
				this.buddy_mgr.setAutoAllow(b_auto);
			}
		}
		else {
			tsk_utils_log_error("buddy>>>init not supported???...");
		}
			
	}
	/* buddy manage, add buddy By Taurus.Feng.2014-09-15*/
	this.BuddyManageAdd = function(scheme, b_type) {

		if (b_type == buddy_type.BUDDY_PARTNER){
			this.buddy_mgr.buddyAddPartner(this.id_Realm, scheme, oper_type.ADD_BUDDY, oper_head.ADD_FRIEND);
		}
		else if(b_type == buddy_type.RECENT_CONTANTS) {
			this.buddy_mgr.buddyAdd(this.id_Realm, scheme, oper_type.ADD_RECENT, oper_head.ADD_LATEST_FRIEND);
		}
		else
			tsk_utils_log_error("buddy>>>add not supported???...");
	}
	
	this.BuddyManageAllow = function(scheme, b_allow) {
		if(!this.autoAllow) {
			this.buddy_mgr.buddyAllow(this.id_Realm, scheme, oper_type.ADD_BUDDY_REQ, b_allow);
		} else {
			tsk_utils_log_error("buddy>>>autoallow???...");
		}
	}
	
	/* buddy manage, get buddy By Taurus.Feng.2014-09-15*/
	this.BuddyManageGet = function(scheme, b_type) {
		
		if (b_type == buddy_type.BUDDY_PARTNER){
			this.buddy_mgr.buddyGetPartner(this.id_Realm, scheme, oper_type.GET_BUDDY, oper_head.GET_FRIEND);
		}
		else if(b_type == buddy_type.RECENT_CONTANTS) {
			this.buddy_mgr.buddyGet(this.id_Realm, scheme, oper_type.GET_RECENT, oper_head.GET_LATEST_FRIEND);
		}
		else
			tsk_utils_log_error("buddy>>>get not supported???...");
			
		
	}
	/* buddy manage, get buddy By Taurus.Feng.2014-09-15*/
	this.BuddyManageDel = function(scheme, b_type) {

		if (b_type == buddy_type.BUDDY_PARTNER){
			this.buddy_mgr.buddyDelPartner(this.id_Realm, scheme, oper_type.DEL_BUDDY, oper_head.DELETE_FRIEND);
		}
		else if(b_type == buddy_type.RECENT_CONTANTS) {
			this.buddy_mgr.buddyDel(this.id_Realm, scheme, oper_type.DEL_RECENT, oper_head.DELETE_LATEST_FRIEND);
		}
		else
			tsk_utils_log_error("buddy>>>del not supported???...");
			
	}
	
	/* buddy manage, get buddy By Taurus.Feng.2014-09-15*/
	this.BuddyManageSend = function(scheme, b_type) {

		if (b_type == buddy_type.BUDDY_PARTNER){
			this.buddy_mgr.buddySend(this.id_Realm, scheme, oper_type.SEND_BUDDY, oper_head.HEADR_NULL);
		}
		else if(b_type == buddy_type.RECENT_CONTANTS) {
			this.buddy_mgr.buddySend(this.id_Realm, scheme, oper_type.SEND_RECENT, oper_head.HEADR_NULL);
		}
		else
			tsk_utils_log_error("buddy>>>del not supported???...");
			
	}
	
	
	
	this.BuddyManageGetChatH = function(scheme, b_type) {

		if (b_type == buddy_type.BUDDY_PARTNER){
			this.buddy_mgr.buddyGetChatH(this.id_Realm, scheme, oper_type.GETCHAT_BUDDY, oper_head.GET_HISTORY_MESSAGES);
		}
		else if(b_type == buddy_type.RECENT_CONTANTS) {
			this.buddy_mgr.buddyGetChatH(this.id_Realm, scheme, oper_type.GETCHAT_RECENT, oper_head.GET_HISTORY_MESSAGES);
		}
		else
			tsk_utils_log_error("buddy>>>chat history not supported???...");
			
	}
	
	
	
	/* publish source to room : to (room_id) */
	this.CallPublish = function(s_type, room_id, o_ConfigMoreCall) {
		
		for(var i=0; i<o_ConfigMoreCall.length; ++i){

			var o_ConfigCall = o_ConfigMoreCall[i];			
			// 1. params parse (1)->lo_held(true)->ro_held(false)->sendonly
			o_ConfigCall.o_publish_subscribe_mode = "1";
			o_ConfigCall.call_PhoneNumber = o_ConfigCall.call_PhoneNumber;
			if(o_ConfigCall.device_index !== undefined || o_ConfigCall.device_index !== null || o_ConfigCall.device_index !== -1) {
				devices_info.posV = (s_type === 'call-video' ? o_ConfigCall.device_index:0);
				devices_info.posA = (s_type === 'call-audio' ? o_ConfigCall.device_index:0);
			}

			// 2. room is exist
			var room = this.oRoomList.get(room_id);
			if(room && room.status == ret_code.MEET_JOIN) {
				// 3. create call object
				var rCall = new confer_mgr_call(this.oInstance);
				rCall.init(room, s_type, o_ConfigCall.call_PhoneNumber, o_ConfigCall);
				var cl = rCall.Call();
				if(cl)	room.mgr.setCall(o_ConfigCall.call_PhoneNumber, rCall, room);
				// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
				return ((cl&&cl.handup_id)?cl.handup_id:null); 
			} else {
				
				this.oInstance.cbMsgInfo(ret_code.ROOM_NOT, "Please first Join Room [" +room_id+ "]");
			}
		}
	}
	
	/* subscribe source to room : to (room_id + source-id) */
	this.CallSubscribe = function(s_type, room_id, o_ConfigMoreCall) {
		
		for(var i=0; i<o_ConfigMoreCall.length; ++i){
			
			var o_ConfigCall = o_ConfigMoreCall[i];
			// 1. params parse publish_subscribe_mode(2)->lo_held(false)->ro_held(true)->recvonly
			o_ConfigCall.o_publish_subscribe_mode = "2";
			o_ConfigCall.source_id = o_ConfigCall.call_PhoneNumber;
			o_ConfigCall.call_PhoneNumber = room_id; 
			o_ConfigCall.sip_headers = [{ name: 'Source-ID', value: o_ConfigCall.source_id }, 
																	o_ConfigCall.audio_mode!="0"?{name: 'Audio-Mode', value: o_ConfigCall.audio_mode}:{}]; 
																	// audio mode : 0 video | 1 audio only subs | 2 audio both ps
			
			// 2. room is exist
			var room = this.oRoomList.get(room_id);
			if(room && room.status == ret_code.MEET_JOIN) {
				
				// 3. create call object
				var rCall = new confer_mgr_call(this.oInstance);
				rCall.init(room, s_type, o_ConfigCall.call_PhoneNumber, o_ConfigCall);
				var cl = rCall.Call();				
				if(cl)	room.mgr.setCall(o_ConfigCall.call_PhoneNumber, rCall, room);
				// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
				return ((cl&&cl.handup_id)?cl.handup_id:null); 
			} else {
				this.oInstance.cbMsgInfo(ret_code.ROOM_NOT, "Please first join room [" +room_id+ "]");
			}
		}
	}
	
	this.CallNormal = function(s_type, room_id, o_ConfigMoreCall) {
		for(var i=0; i<o_ConfigMoreCall.length; ++i){
			
			var o_ConfigCall = o_ConfigMoreCall[i];
			o_ConfigCall.o_publish_subscribe_mode = "0";
			o_ConfigCall.call_PhoneNumber = o_ConfigCall.call_PhoneNumber;
		
			// 2. room is exist
			var room = this.oRoomList.get(room_id);
			if(room && room.status == ret_code.MEET_JOIN) {
				// 3. create call object
				var rCall = new confer_mgr_call(this.oInstance);
				rCall.init(room, s_type, o_ConfigCall.call_PhoneNumber, o_ConfigCall);
				var cl = rCall.Call();
				if(cl)	room.mgr.setCall(o_ConfigCall.call_PhoneNumber, rCall, room);
				// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
				return ((cl&&cl.handup_id)?cl.handup_id:null); 
			} else {
				
				this.oInstance.cbMsgInfo(ret_code.ROOM_NOT, "Please first Join Room [" +room_id+ "]");
			}
		}
	}
		
	/* is or not exist call phone sessioncall */
	this._sipSessionCallExist = function (oSessionObj){
		if(this.oRoomList.isEmpty())
			return false;
			
		for(var i=0; i<this.oRoomList.arr.length; ++i) {
			var room = this.oRoomList.arr[i].value;
			var s = room.mgr.sessionCallExist(oSessionObj, room);
			if(s) return s;
		}
		
		return false;
	}
	
	/* is exist call phone sessioncall */
	this._sipSessionPhoneNuber = function (cPhoneNumber, _type, sourceid){
		if(this.oRoomList.isEmpty())
			return false;
			
			
		for(var i=0; i<this.oRoomList.arr.length; ++i) {
			var room = this.oRoomList.arr[i].value;
			var s = room.mgr.sessionPhoneNuber(cPhoneNumber, _type, sourceid, room);
			if(s) return s;
		}
		
		return false;
	}
	
	/* delete call phone sessioncall */
	this._sipSessionCallDelete = function (oSessionObj, isSession){
		if(this.oRoomList.isEmpty())
			return false;
			
		for(var i=0; i<this.oRoomList.arr.length; ++i) {
			var room = this.oRoomList.arr[i].value;
			var s = room.mgr.sessionCallDelete(oSessionObj, isSession, room);
			if(s) return s;
		}
		
		return false;
	}
	
	/* get call phone sessioncall */
	this._sipSessionSubsCallGet = function (room_id){
		if(this.oRoomList.isEmpty())
			return false;
			
		for(var i=0; i<this.oRoomList.arr.length; ++i) {
			if(room_id != this.oRoomList.arr[i].key)
				continue;
			var room = this.oRoomList.arr[i].value;
			var s = room.mgr.sessionSubsCallGet(room);
			if(s) return s;
		}
		return false;
	}
	
	/* is or not info session */
	this._sipSessionRoomInfo = function(oSessionObj) {
		if(this.oRoomList.isEmpty())
			return false;
		for(var i=0; i<this.oRoomList.arr.length; ++i) {
			var room = this.oRoomList.arr[i].value;
			if(room.oSipSessionInfo == oSessionObj)
				return room;
		}
		return false;
	}
	
}
confer_mgr_user.prototype = Object.create(confer_mgr_session.prototype);


/* buddy manage, add buddy By Taurus.Feng.2014-09-15*/
function buddy_list_manage(_This) {
	confer_mgr_session.call(this, _This);
	
	var _Buddy = this;
	
	this.b_BuddyStatus = null;
	this.autoAllow = false; // audo add buddy allow
	// operate type
	buddy_type = {
		RECENT_CONTANTS: "recent",
		BUDDY_PARTNER:	"buddy",
	}
	
	oper_type = {
		INIT_RECENT		:"initrecent",
		INIT_BUDDY		:"initbuddy",
		ADD_RECENT		:"addrecent",
		ADD_BUDDY			:"addbuddy",
		ADD_BUDDY_REQ	:"addbuddyreq",
		DEL_RECENT		:"delrecent",
		DEL_BUDDY			:"delbuddy",
		GET_RECENT		:"getrecent",
		GET_BUDDY			:"getbuddy",
		SEND_RECENT		:"sendrecent",
		SEND_BUDDY		:"sendbuddy",
		GETCHAT_RECENT:"getchatrecent",
		GETCHAT_BUDDY	:"getchatbuddy",
		RECV_BUDDY		:"recvbuddy",
		
		WATCHINFO: 	"watchinfo",
		PRESENCE:		"presence",
		PRES_RULES: "rules"
	};
	
	
	oper_head = {
		HEADR_NULL						: "null",
		HEADR_NAME						: "OC",
		ADD_FRIEND_REQUEST		: "AFR",
		ADD_FRIEND_ALLOWED		: "AFA",
		ADD_FRIEND_FORBIDDEN	: "AFF",
		INIT_FRIEND_RULE			: "IFR",
		INIT_FRIEND						: "IF",
		ADD_FRIEND						: "AF",
		DELETE_FRIEND					: "DF",
		GET_FRIEND						: "GF",
		INIT_LATEST_FRIEND		: "ILF",
		ADD_LATEST_FRIEND			: "ALF",
		DELETE_LATEST_FRIEND	: "DLF",
		GET_LATEST_FRIEND			: "GLF",
		GET_HISTORY_MESSAGES	: "GHM"
	};
	
	var expire = {
		watchinfoexp: 200000,
		presence: 20000
	}
	var sub_handling = {
		block: 'block',
		confirm: 'confirm',
		politeblock: 'polite-block',
		allow: 'allow'
	};
	
	var subscription_state = {
		active: 'active',
		pending: 'pending'
	};
	
	this.buddySession = [];
	
	var blsAddUser = "blsput";
	var blsDelUser = "blsdel";
	var blsGetUser = "blsget";
	var presPutUser = "presput";
	
	// xml parse <==> json 
	var x2js = new X2JS();
	
	this.setCodeMsg = function(Status, msg, session) {
		this.b_BuddyStatus 	= Status;
		this.oInstance.cbMsgInfo(Status, msg, session);
		tsk_utils_log_info('cfManager>>>buddy info recv status<'+Status+'> msg:'+msg);
	};
	
	
	this.setBuddySession = function(s, c, op, d, r, ct) {
			if(s && c) {
			var obj = {	session: s,
									scheme: c,
									oper: op,
									dir: d,
									realm: r,
									content: ct};
			if(obj)	this.buddySession.push(obj);
		}
	}
	
	var setRulesHead = function(type, dir, uri, group) {
		var hdrs = [];
		var hdr;
		
		if(type == oper_type.INIT_RECENT || type == oper_type.INIT_BUDDY ||
			type == oper_type.GET_ALL || type == oper_type.PUT_ALL || type == oper_type.DEL_ALL) { // get all 
			hdr = { name: 'Xcap-Buddy', value: dir };
			hdrs.push(hdr);
		} 
		else if(type == oper_type.GET) {
			hdr = { name: 'Xcap-Buddy', value: dir+"~~/resourcelists/list[@name='"+group+"']/entry[@uri='"+uri+"']" };
			hdrs.push(hdr);
		}
		else if(type == oper_type.PRES_RULES || type == oper_type.PRESENCE){
			hdr = {}; // { name: 'Xcap-Buddy', value: dir+"~~/ruleset/rule[@id='"+uri+"']" };
			hdrs.push(hdr);
		}
		return hdrs;
	}
	
	var setRulesBuddyList = function(buddyid, uri, sub_handling) {
		var rules = '<?xml version="1.0"?><ruleset>';
		rules += '<rule id="'+buddyid+'"><conditions><identity><one id="'+uri+'"/></identity></conditions><actions><sub-handling>'+sub_handling+'</sub-handling></actions><transformations/></rule>';
 		rules += '<rule id="base"><conditions><identity><many/></identity></conditions><actions><sub-handling>confirm</sub-handling></actions><transformations/></rule></ruleset>';
		return rules;
	}
	
	var setXmlBuddyList = function(realm, scheme, oper, head) {
		var xmlbls;
		if(head == oper_head.INIT_FRIEND || head == oper_head.INIT_LATEST_FRIEND) {
			xmlbls = '<?xml version="1.0"?><resource-lists xmlns="urn:ietf:params:xml:ns:resource-lists"><list name="rootgroup"></list></resource-lists>';
		}
		else if(oper == oper_type.INIT_BUDDY && head == oper_head.INIT_FRIEND_RULE) {
			xmlbls = '<?xml version="1.0"?><ruleset>';
			xmlbls += '<rule id="white"><conditions><identity></identity></conditions><actions><sub-handling>allow</sub-handling></actions><transformations/></rule>';
			xmlbls += '<rule id="black"><conditions><identity></identity></conditions><actions><sub-handling>block</sub-handling></actions><transformations/></rule>';
			xmlbls += '<rule id="base"><conditions><identity><many/></identity></conditions><actions><sub-handling>confirm</sub-handling></actions><transformations/></rule>';
			xmlbls += '</ruleset>';
		}
		else if(oper == oper_type.ADD_BUDDY && head == oper_head.ADD_FRIEND_REQUEST) {
			xmlbls = (scheme&&scheme.content)?scheme.content:'requst add buddy';
		}
		else if(head == oper_head.ADD_FRIEND || head == oper_head.ADD_LATEST_FRIEND) {
			xmlbls = '<entry uri="sip:'+scheme.buddyid+'@'+realm+'"><display-name>'+scheme.displayname+'</display-name></entry>';
		}
		else if(head == oper_head.ADD_FRIEND_ALLOWED) {
			xmlbls = 'allowed';
		}
		else if(oper == oper_type.ADD_BUDDY_REQ) {
			xmlbls = 'set';
		}
		else {
			xmlbls = 'other';
		}
		return xmlbls;
	}
	
	this.setAutoAllow = function(b_auto) {
		this.autoAllow = b_auto;
	}
	this.buddyAdd = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		var content = setXmlBuddyList(realm, scheme, oper, head);
		var iRet = this._sipInfoSend(to, content, 'application/xcap', [{name:'OC', value:head}]);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Add Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	
	// buddy partner add
	this.buddyAddPartner = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		var hdrs = [{name:'Event', value:'presence'},{name:'OC', value:head}];
		var iRet = this._sipSubscribeSend(to, hdrs, expire.presence);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Add Partner Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	
	/* buddy manage, add buddy By Taurus.Feng.2014-09-15
	** realm 	: realm, 
	** scheme	: user info,
	** oper		: operate type,
	** head		: hdr or sub operate type */
	this.buddyGet = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		var iRet = this._sipInfoSend(to, "get", 'application/xcap', [{name:'OC', value:head}]);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Get Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	this.buddyGetPartner = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		var iRet = this._sipInfoSend(to, "get", 'application/xcap', [{name:'OC', value:head}]);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Get Partner Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	
	
	
	this.buddyDel = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		var iRet = this._sipInfoSend(to, "del", 'application/xcap', [{name:'OC', value:head}]);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Del Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	
	this.buddyDelPartner = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		var iRet = this._sipInfoSend(to, "del", 'application/xcap', [{name:'OC', value:head}]);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Del Partner Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	
	this.buddySend = function(realm, scheme, oper, head) {
		var to = ((scheme&&scheme.buddyid)?scheme.buddyid:"");
		if(!scheme || "" == scheme.content) return;
		var a = unescape(encodeURIComponent(scheme.content));
		var buf = new ArrayBuffer(a.length);
		var b = new Uint8Array(buf);
		for(var i=0; i<a.length; i++) {
			b[i] = a[i].charCodeAt(0) & 0xff;
		}
		var iRet = this._sipIMSend(to, tsk_buff_str2ib(scheme.content), null);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Send Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, head, realm); // add session info object
		}
	}
	
	
	
	
	
	
	this.buddyGetChatH = function(realm, content, oper, dir) {
		if(!content || content.chat_user == "") return;
		var scheme = {"buddyid": content.chat_user, "displayname": content.chat_user, "group": "rootgroup"};
		var iRet = this._sipInfoSend(scheme.buddyid, JSON.stringify(content), 'application/json', [{ name: 'OC', value: 'GHM' }]);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Get Chat Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper, dir, realm, content); // add session info object
		}
	}


	
	
	this.buddyRules = function(to, buddyid, uri, handle) {
		var hdrs = setRulesHead(5, oper_type.PRES_RULES, uri);
		var content = setRulesBuddyList(buddyid, uri, handle);
		var iRet = this._sipInfoSend(to, content, 'application/resource-lists+xml', hdrs);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Rules Param is Fail');
		} else {
			this.setBuddySession(iRet, oper_type.PRES_RULES); // add session info object
		}
	}
	

	
	
	/* buddy partner watchinfo self: buddyid->self, hdr->Event headr presence.winfo*/
	this.buddyPresenceWatch = function(scheme, hdr) {
		
		var iRet = this._sipSubscribeSend(scheme.buddyid, hdr, expire.watchinfoexp);
		if(iRet == -1) {
			this.setCodeMsg(ret_code.BUDD_FAIL, 'Buddy Watch Param is Fail');
		} else {
			this.setBuddySession(iRet, scheme, oper_type.WATCHINFO); // add session info object
		}
	}
	
	
	
	this.getBuddyInfoSession = function(s) {
		for(var i=0; i<this.buddySession.length; i++) {
			if(this.buddySession[i].session == s) {
				return this.buddySession[i];
			}
		}
	}
	
	this.getBuddyInfoHead = function(e) {
		
		if(e.type == "i_new_message") {
			var session = {	session: null,	scheme: null, oper: oper_type.RECV_BUDDY, dir: null, realm: null};
			return session;
		} 
		else if (e.type == "i_new_info") {
			var msg = e.o_event.get_message();
			var head = msg?msg.get_header(tsip_header_type_e.Dummy):null;
			if(head==null) return null;
			if(head.s_name != oper_head.HEADR_NAME || head.s_value != oper_head.ADD_FRIEND_REQUEST) 
			return null;
			
			var session = {	session: null,	scheme: null, oper: oper_type.ADD_BUDDY_REQ, dir: null, realm: null};
			return session;
		}
		
	}
	
	this.buddyAllow = function(realm, scheme, oper, b_allow) {
		if(b_allow) {
			this.buddyAdd(_Buddy.oUser.id_Realm, scheme, oper, oper_head.ADD_FRIEND_ALLOWED); // allow
			this.buddyAdd(_Buddy.oUser.id_Realm, scheme, oper, oper_head.ADD_FRIEND); // list
		} else {
			this.buddyAdd(_Buddy.oUser.id_Realm, scheme, oper, oper_head.ADD_FRIEND_FORBIDDEN); // forbid
		}
	} 
	
	var DOMNodeTypes = {
		ELEMENT_NODE 	   : 1,
		TEXT_NODE    	   : 3,
		CDATA_SECTION_NODE : 4,
		COMMENT_NODE	   : 8,
		DOCUMENT_NODE 	   : 9
	};
	
	var NotifyUp = function(s, st, val) {
		var buddyl = {"type": s.oper, "scheme": s.scheme, "status": st, "content": val};
		_Buddy.setCodeMsg(ret_code.BUDD_MGR, "buddy_manage", buddyl);
	}
	var cb = {
		parseToJson: function(content) {
			// parse xml to json
			if("" == content) return "";
			var xml = x2js.parseXmlString(content);
			var jsonobj = x2js.xml2json(xml);
			return jsonobj;
		},
		watchinfo_cb: function(e, s) {

			var msg = e.o_event.get_message();
			var head = msg?msg.get_header(tsip_header_type_e.Dummy):null;
			tsk_utils_log_info('buddylist >>>buddy req > oper ' +s.oper + ' head ' + head);
			if(head && head.s_name == oper_head.HEADR_NAME && head.s_value == oper_head.ADD_FRIEND_REQUEST) {
				var from = msg?msg.get_header(tsip_header_type_e.From):"";
				if(from && from.toString()) {
					
					var scheme = {"buddyid": from.o_uri.s_user_name, "displayname": from.o_uri.s_user_name, "group": "rootgroup"};
					// var buddyl = {"type": s.oper, "scheme": scheme, "status": "req", "content": ""};
					s.scheme = scheme;
					NotifyUp(s, "req", "");
					
					if(_Buddy.autoAllow) {
						//_Buddy.buddyAdd(_Buddy.oUser.id_Realm, scheme, s.oper, oper_head.ADD_FRIEND_ALLOWED); // allow
						//_Buddy.buddyAdd(_Buddy.oUser.id_Realm, scheme, s.oper, oper_head.ADD_FRIEND); // allow
						_Buddy.buddyAllow(_Buddy.oUser.id_Realm, scheme, s.oper, true);
					}
				}
			} else {
				tsk_utils_log_info('buddylist >>>buddy req > oper ' +s.oper + ' head ' + head.toString() + "****");
				if(oper_head.ADD_FRIEND_ALLOWED == s.dir) {
					NotifyUp(s, "OK", "");
				}
			}
			
		},
		presence_cb: function(e, s) { // add buddy , send info to buddy for confirm
			var msg = e.o_event.get_message();
			var hdr_event = msg?msg.get_header(tsip_header_type_e.Event):"";
			var vale = hdr_event?hdr_event.toString():"";
			var hdr_subs_state = msg?msg.get_header(tsip_header_type_e.Subscription_State):"";
			var vals = hdr_subs_state?hdr_subs_state.toString():"";
			tsk_utils_log_info('buddylist >>>notify event > oper ' +s.oper + ' event ' + vale + 'status ' + vals);
			
			if(hdr_subs_state && hdr_subs_state.s_state && hdr_subs_state.s_state==subscription_state.pending) {

				// add buddy request
				_Buddy.buddyAdd(s.realm, s.scheme, s.oper, oper_head.ADD_FRIEND_REQUEST);
				
				NotifyUp(s, hdr_subs_state.s_state, "");
				
			}
			if(hdr_subs_state && hdr_subs_state.s_state && hdr_subs_state.s_state==subscription_state.active) {

				// put rules and resource-list
				_Buddy.buddyAdd(s.realm, s.scheme, s.oper, oper_head.ADD_FRIEND_ALLOWED);
				_Buddy.buddyAdd(s.realm, s.scheme, s.oper, oper_head.ADD_FRIEND);
				
				NotifyUp(s, hdr_subs_state.s_state, "");
			}
			
		},
		xcap_cb: function(e, s) {
			var code = e.getSipResponseCode();
			tsk_utils_log_info('buddylist >>>init > oper ' +s.oper + ' code ' + code);
			if(code == 404) { // not found, so init
				if(s.oper == oper_type.INIT_RECENT) {
					_Buddy.buddyAdd(s.realm, s.scheme, s.oper, oper_head.INIT_LATEST_FRIEND);
				} 
				else if(s.oper == oper_type.INIT_BUDDY) { // init buddy null list and rules
					_Buddy.buddyAdd(s.realm, s.scheme, s.oper, oper_head.INIT_FRIEND);
					_Buddy.buddyAdd(s.realm, s.scheme, s.oper, oper_head.INIT_FRIEND_RULE);
				} 
			}
			else if(code == 200) { // buddy list Notify to Up
				
				if(oper_head.GET_FRIEND == s.dir || oper_head.INIT_LATEST_FRIEND == s.dir || oper_head.INIT_FRIEND == s.dir) {
					NotifyUp(s, "OK", "");
					return;
				} else {
					if("" == e.getContentString()) return;	
					var jsonl = cb.parseToJson(e.getContentString());
					if(jsonl && jsonl.resource_lists) {
						NotifyUp(s, "OK", jsonl);
					}
				}
			}
		},
		add_recent_cb: function(e, s) {
			var code = e.getSipResponseCode();
			var st = "false"; 
			if(code == 200) st = "OK";
			NotifyUp(s, st, "");
		},
		del_buddy: function(e, s) {
			var code = e.getSipResponseCode();
			var st = "false"; 
			if(code == 200) st = "OK";
			NotifyUp(s, st, "");
		},
		get_buddy: function(e, s) {
			if("" == e.getContentString()) return;	
			var jsonl = cb.parseToJson(e.getContentString());
			if(jsonl && jsonl.resource_lists) {
				NotifyUp(s, "OK", jsonl);
			}
		},
		send_buddy: function(e, s) {
			var code = e.getSipResponseCode();
			var st = "false"; 
			if(code == 200 || code == 202) st = "OK";
			NotifyUp(s, st, "");
		},
		recv_buddy: function(e, s) {
			var msg = e.o_event.get_message();
			var from = msg?msg.o_hdr_From:"";
			if("" == e.getContentString()) return;	
			var buddyid = from.s_display_name?from.s_display_name:from.o_uri.s_user_name;
			var scheme =  {"buddyid": buddyid, "displayname": buddyid, "group": "rootgroup"};
			if(buddyid) {
				//var buddyl = {"type": s.oper, "scheme": scheme, "status": "OK", "content": e.getContentString()};
				//NotifyUp(ret_code.BUDD_MGR, "buddy_manage", buddyl);
				s.scheme = scheme;
				NotifyUp(s, "OK", e.getContentString());
			}
		},
		chat_his: function(e, s) {
			var code = e.getSipResponseCode();
			var st = "false"; 
			if(code == 200) st = "OK";
			if("" == e.getContentString()) return;
			//var buddyl = {"type": s.oper, "scheme": s.scheme, "status": st, "content": JSON.parse(e.getContentString())};
			NotifyUp(s, st, JSON.parse(e.getContentString()));
		},
	};
	
	this.handleBuddyInfo = function(e, s) {
		switch (s.oper){
			case oper_type.ADD_BUDDY_REQ: // accept buddy request info
				cb.watchinfo_cb(e, s);
			break;
			case oper_type.ADD_BUDDY: 		// add buddy 
				cb.presence_cb(e, s);
			break;
			case oper_type.ADD_RECENT:		// add recent 
				cb.add_recent_cb(e, s);
			break;
			case oper_type.INIT_RECENT: 	// init buddy
			case oper_type.INIT_BUDDY:		// init recent
				cb.xcap_cb(e, s);
			break;
			case oper_type.DEL_BUDDY:
			case oper_type.DEL_RECENT:
				cb.del_buddy(e, s);
			break;
			case oper_type.GET_BUDDY:
			case oper_type.GET_RECENT:
				cb.get_buddy(e, s);
			break;
			case oper_type.SEND_BUDDY:
			case oper_type.SEND_RECENT:
				cb.send_buddy(e, s);
			break;
			case oper_type.RECV_BUDDY:
				cb.recv_buddy(e, s);
			break;
			case oper_type.GETCHAT_BUDDY:
			case oper_type.GETCHAT_RECENT:
				cb.chat_his(e, s);
			break;
			default:
				tsk_utils_log_error("**************are you right?****************");
			break;
		};
	}
}
buddy_list_manage.prototype = Object.create(confer_mgr_session.prototype);

function confer_mgr_room(_This) {
	confer_mgr_session.call(this, _This);

	this.b_MgrStatus = ret_code.STATUS_NO;
	
	// temporary obejct ?
	// move to confer_room object : this.oSipSessionInfo = null;
	this.sessionInfo = null; // add create|delete session info 
	this.oSipSessionMessage = null;
	
	this.init = function(to_number, room_id) {
		//this.to = to_number || null;
		//this.room_id = room_id || null;
	}
	
	
	this.NewRoom = function() {
		return new confer_room(this);
	}
	
	this.JoinRoom = function(t, r, room) {
		if(t && r) {
			var jsonObj = {"action": "JOIN_MEETING", "param": {"meeting": r}};
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				room.oSipSessionInfo = iRet; // add session info object
			}
		}
	}
	
	this.LeaveRoom = function(t, r, room) {
		if(t && r) {
			var jsonObj = {"action": "LEAVE_MEETING", "param": {"meeting": r}};
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				room.oSipSessionInfo = iRet; // add session info object
			}
		}
	}
	
	this.CreateRoom = function(t, r, ns) {
		if(t && r) {
			var jsonObj;
			if(ns)
				jsonObj = {"action": "CREATE_MEETING", "param": {"type":"CREATE", "meeting": r, "nodes": ns}};
			else 
				jsonObj = {"action": "CREATE_MEETING", "param": {"type":"CREATE", "meeting": r}};
				
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				this.sessionInfo = iRet; // add session info object
			}
		}
	}

	this.UpdateRoom = function(t, r, ns) {
		if(t && r) {
			var jsonObj;
			if(ns)
				jsonObj = {"action": "UPDATE_MEETING", "param": {"type":"CREATE", "meeting": r, "nodes": ns}};
			else 
				jsonObj = {"action": "CREATE_MEETING", "param": {"type":"CREATE", "meeting": r}};
				
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				this.sessionInfo = iRet; // add session info object
			}
		}
	}
	
	this.DeleteRoom = function(t, r, room) {
		if(t && r) {
			var jsonObj = {"action": "DELETE_MEETING", "param": {"type":"DELETE", "meeting": r}};
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				this.sessionInfo = iRet; // add session info object
			}
		}
	}
	
	this.GetPubInfoRoom = function(t, r, room) {
		if(t && r) {
			var jsonObj = {"action": "MEETING_INFO", "param": {"type":"PUBLISH", "meeting": r}};
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				room.oSipSessionInfo = iRet; // add session info object
			}
		}
	}
	
	this.SendPublishCtl = function(t, r, p, i, room) {
		if(t && r) {
			var jsonObj = {"action": "PUBLISH_CONTROL", "param": {"meeting": r, "type": p, "id": i}};
			var iRet = this._sipInfoSend(t, JSON.stringify(jsonObj), 'application/json');
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				room.oSipSessionInfo = iRet; // add session info object
			}
		}
	}
	
	this.SendIM = function(t, r, room, content) {
		if(t && r) {
			var iRet = this._sipIMSend(t, content);
			if(iRet == -1) {
				this.setCodeMsg(ret_code.MEET_FAIL, 'Meeting Param is Fail');
			} else {
				this.oSipSessionMessage = iRet; // sip message outside ROOM
			}
		}
	}
	
	this.setCall = function(phone, oCall, room) {
		if(!room.oSipSessionMoreCall)
			room.oSipSessionMoreCall = new Array();
		if(oCall)
			room.oSipSessionMoreCall.push(oCall);
	}
	
	this.byeCall = function(room) {
		// uncall all session
		for(var i=0; i<room.oSipSessionMoreCall.length; ++i) {
			room.oSipSessionMoreCall[i].oCall.o_SipSessionCall.hangup();
		}
	}
	
	this.setCodeMsg = function(Status, msg, session) {
		this.b_MgrStatus 	= Status;
		this.oInstance.cbMsgInfo(Status, msg, session);
		tsk_utils_log_info('cfManager>>>room info status<'+Status+'> msg:'+msg);
	};
	
	this.setRoomStatus = function(Status, room) {
		tsk_utils_log_info('cfManager>>>room ['+room.room_id+'] set status->' + Status);
		room.status = Status;
	}
	

	/*	handle info message	interface*/
	this.handleInfo = function(e) {
		if(e.getContentString() == ""){
			//this.oSipSessionInfo = null;
			return;
		}
		
		var jsonObject = JSON.parse(e.getContentString());
		// unregister info
		if(jsonObject.action == 'UNREGITER_USER') {
			this.setCodeMsg(ret_code.UNREG_INFO, 'server unregister client...');
			// this.oUser.oSipSessionRegister.unregister(); // server not bye, so ... under 
			if(this.oUser) this.oUser.UnRegister();
		} else {
		// meeting info
			this.setMeetingInfo(e);
		}
	}
	/*	200 OK response meeting info etc	*/
	this.setMeetingInfo = function(e) {

		var jsonObject = JSON.parse(e.getContentString());
		if(jsonObject.action == 'CREATE_MEETING'){
			this.setCodeMsg(ret_code.MEET_CREATE, 'Create meeting :[' + jsonObject.param.meeting + ']-> ' + jsonObject.param.result, jsonObject);
		}
		else if(jsonObject.action == 'DELETE_MEETING'){
			this.setCodeMsg(ret_code.MEET_DELELE, 'Delete meeting :[' + jsonObject.param.meeting + ']-> ' + jsonObject.param.result, jsonObject);
		}
		else if(jsonObject.action == 'MEETING_INFO'){
			this.setCodeMsg(ret_code.MEET_INFO, 'Info meeting :[' + jsonObject.param.meeting + ']-> ' + jsonObject.param.result);
			
			// back publish conferlist
			if(jsonObject.param.type == 'PUBLISH' && jsonObject.param != null && jsonObject.param.result != null){
					var oSipConferList = jsonObject.param;
					// 
					var oSipSessionSubs = this.oUser._sipSessionSubsCallGet(jsonObject.param.meeting);
					var meet = {"type": jsonObject.param.type, "orgMeetinglist": oSipSessionSubs, "srcMeetinglist": oSipConferList};
					this.setCodeMsg(ret_code.MEET_LIST, 'Recvied INFO Meeting Publish'/*e.o_event.o_message*/, meet);
			}
		}
		else if(jsonObject.action == 'JOIN_MEETING') {
			
			// not 0, so deleter oom
			var room_id = jsonObject.param.meeting;
			var room = this.oUser.oRoomList.get(room_id);
			if(jsonObject.param.result == 0 && room) { 
				this.setRoomStatus(ret_code.MEET_JOIN, room); // set room status
			} else {
				this.oUser.oRoomList.remove(room_id);
				tsk_utils_log_info('cfManager>>>room ['+room_id+'] join ret status not 0, del from list');
			}
			this.setCodeMsg(ret_code.MEET_JOIN, 'Join meeting :[' + jsonObject.param.meeting + ']-> ' + jsonObject.param.result, jsonObject);
		}
		else if(jsonObject.action == 'LEAVE_MEETING') {
			var room_id = jsonObject.param.meeting;
			var room = this.oUser.oRoomList.get(room_id);
			if(/*jsonObject.param.result == 0 &&*/ room) { // del leave room status
				this.setRoomStatus(ret_code.MEET_LEAVE, room); // set room status
			} else {
				tsk_utils_log_info('cfManager>>>room leave is not exist');
			}
			this.setCodeMsg(ret_code.MEET_LEAVE, 'Leave meeting :[' + jsonObject.param.meeting + ']-> ' + jsonObject.param.result, jsonObject);
		}
		else if(jsonObject.action == 'PUBLISH_CONTROL') { // Meeting publish control, for Keep silence
			this.setCodeMsg(ret_code.MEET_CTRL, 'Info meeting :[' + jsonObject.param.meeting + ']-> ' + jsonObject.param.result);
		}
	}
	
	/* is or not exist call phone sessioncall */
	this.sessionCallExist = function (oSessionObj, _This){
		if(!_This.oSipSessionMoreCall)
			return false;
		for(var i=0; i<	_This.oSipSessionMoreCall.length; ++i){
			if(oSessionObj == _This.oSipSessionMoreCall[i].oCall.o_SipSessionCall){
				return _This.oSipSessionMoreCall[i];
			}
		}
		return false;
	}
	
	/* is exist call phone sessioncall */
	this.sessionPhoneNuber = function (cPhoneNumber, _type, sourceid, _This){
		if(!_This.oSipSessionMoreCall)
			return false;
		for(var i=0; i<	_This.oSipSessionMoreCall.length; ++i){
			// ����ʱ����ǩID
			if(_type == "D" && "P" == _This.oSipSessionMoreCall[i].oCall.o_type){
				// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
				if(cPhoneNumber == _This.oSipSessionMoreCall[i].oCall.o_call_PhoneNumber && sourceid == _This.oSipSessionMoreCall[i].oCall.handup_id)
					return _This.oSipSessionMoreCall[i].oCall.o_SipSessionCall;
			}
			// ����ʱ������ID+��ԴID
			else if(_type == "D" && "S" ==  _This.oSipSessionMoreCall[i].oCall.o_type){
				// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
				if(cPhoneNumber == _This.oSipSessionMoreCall[i].oCall.o_call_PhoneNumber && sourceid == _This.oSipSessionMoreCall[i].oCall.handup_id)
					return _This.oSipSessionMoreCall[i].oCall.o_SipSessionCall;
			}
		}
		return false;
	}
	
	/* delete call phone sessioncall */
	this.sessionCallDelete = function (oSessionObj, isSession, _This){
		if(!_This.oSipSessionMoreCall)
			return false;
		for(var i=0; i<	_This.oSipSessionMoreCall.length; ++i){
			// call session
			if(isSession == true && oSessionObj == _This.oSipSessionMoreCall[i].oCall){
				tsk_utils_log_info('cfManager>>>delete oSipSessionMoreCall[' + i + ']=' + oSessionObj.o_call_PhoneNumber + ":" + oSessionObj.source_id);
				_This.oSipSessionMoreCall[i].oCall = null;
				return _This.oSipSessionMoreCall.splice(i, 1);
			}
			// phone number
			if(isSession == false && oSessionObj == _This.oSipSessionMoreCall[i].oCall.o_call_PhoneNumber){
				_This.oSipSessionMoreCall[i].oCall = null;
				tsk_utils_log_info('cfManager>>>delete oSipSessionMoreCall[' + i + ']=' + oSessionObj);
				return _This.oSipSessionMoreCall.splice(i, 1);
			}
		}
		return false;
	}
	
	/* get call phone sessioncall */
	this.sessionSubsCallGet = function (_This){
		if(!_This.oSipSessionMoreCall)
			return null;
			
		var oSipSessionSubsCall = new Array();
		for(var i=0; i<	_This.oSipSessionMoreCall.length; ++i){
			if("S" == _This.oSipSessionMoreCall[i].o_type){
				 oSipSessionSubsCall.push(_This.oSipSessionMoreCall[i]);
			}
		}
		return oSipSessionSubsCall;
	}
	
}
confer_mgr_room.prototype = Object.create(confer_mgr_session.prototype);

function confer_room(_This, to_number, room_id) {
	this.mgr = _This;
	this.to = to_number || null;
	this.room_id = room_id || null;
	this.oSipSessionMoreCall = [];
	// info object per room
	this.oSipSessionInfo = null;
	
	this.status = ret_code.STATUS_NO;
	
	this.init = function(t, r) {
		this.to = t || null;
		this.room_id = r || null;
		this.status = ret_code.STATUS_NO;
	}
	
}


function confer_mgr_call(_This) {
	confer_mgr_session.call(this, _This);
	this.type = null;
	this.phone = null; // to room
	this.source_id = null; 	// response 200 OK to set 
	this.mode = null; // publish(P) or subscribe(S) or normal(D)
	
	
	
	
	this.oConfigP = {
		audio_remote: null,
		video_local: null,
		video_remote: null,
		bandwidth: { audio:undefined, video:undefined },
		video_size: { minWidth:undefined, minHeight:undefined, maxWidth:undefined, maxHeight:undefined },
		events_listener: { events: '*', listener: this._onSipEventSession },
		sip_caps: [
		{ name: '+g.oma.sip-im' },
		{ name: '+sip.ice' },
		{ name: 'language', value: '\"en,fr\"' }
		]
	};
		
	this.room = null;
	this.oCall = null; // call session etc
	
	this.b_callStatus 	= ret_code.STATUS_NO;
	
	this.init = function(room, s_type, call_PhoneNumber, o_ConfigCall) {
		this.room = room || null;
		this.type = s_type || null;
		this.phone = call_PhoneNumber || null;
		this.oConfigP = o_ConfigCall || null;
		this.mode = (o_ConfigCall.o_publish_subscribe_mode == "1")?'P':(o_ConfigCall.o_publish_subscribe_mode == "2")?'S':'D';
	}
	
	this.Call = function() {
		this.Validy();
		var oCall = this._sipOneCall(this.type, this.phone, this.oConfigP);
		if(oCall) {
			return this._sipSessionSubsCallAdd(this.phone, this.oConfigP, oCall);
		} else {
			this.setCodeMsg(ret_code.CALL_FAIL, 'Call Fail');
			return null;
		}
	}
	
	this.Validy = function() {
		
		if (!this.oInstance.b_initialized || !this.oSipStack){
			this.setCodeMsg(ret_code.REG_FAIL, '<i>Not OK, Please Re Register</i>');
			return;
		}
		
		// performance test analysis: isPerfTest=true  other: subscirbe or pubulish not inspect validy
		if (!this.room.oSipSessionMoreCall || this.oInstance.isPerfTest || true ) { 
			if(tsk_string_is_null_or_empty(this.phone)){
				this.setCodeMsg(ret_code.CALL_ING, '<b>Call Phone Number is Kong</b>');
				return;
			}
		
			if(this.type != "call-audio" && this.type != "call-video" && this.type != "call-screenshare"){
				this.setCodeMsg(ret_code.CALL_ING, '<b>Call Type is not Supported</b>');
				return;
			}
			if(this.type == 'call-screenshare') {
				if(!SIPml.isScreenShareSupported()) {
					alert('Screen sharing not supported. Are you using chrome 26+?');
					return;
				}
				if (!location.protocol.match('https')){
					if (confirm("Screen sharing requires https://. Please first set https?")) {
						this.oInstance.sipUnRegister();
					}
					return;
				}
			}
		} else {
			confirm('You one, Please first [' + call_PhoneNumber + '],' + 'Hang Up');
		}
	}
	
	this.setCodeMsg = function(Status, msg, session) {
		this.b_callStatus 	= Status;
		this.oInstance.cbMsgInfo(Status, msg, session);
		tsk_utils_log_info('cfManager>>>call status<'+Status+'> msg:'+msg);
	};
	
	this.setSourceId = function(e) {
		var SourceId = e.o_event.o_message.get_header(tsip_header_type_e.Dummy);
		if(SourceId && SourceId.s_name) {
			tsk_utils_log_info("sip RECV (" + e.getSipResponseCode() + " ): " + SourceId.s_name + "->" + SourceId.s_value);
			this.oCall.source_id = SourceId.s_value; // set source-id to mgr call
		}
		
		this.setCodeMsg(ret_code.CALL_SET, SourceId.s_value, this.oCall);
	}
	
		// batch handle 
	this._newBatch = function(_m, _d, _n, _t, _s){
		var v = new EVC.VideoView({type:_m,show_tag:_n,parent_div:_d,session:_s,video_type:_t});
		v.init();
		return v;
	};
	
	this._sipSessionSubsCallAdd = function (call_PhoneNumber, o_ConfigCall, oSession){
		// 
		var oSipSessionOneCall = {};
		oSipSessionOneCall.o_SipSessionCall = oSession;
		oSipSessionOneCall.o_call_PhoneNumber = call_PhoneNumber;
		oSipSessionOneCall.o_source_id = o_ConfigCall.source_id; // subscribe source
		// oSipSessionOneCall.o_ConfigCall = o_ConfigCall;
		oSipSessionOneCall.audioRemote = o_ConfigCall.audio_remote;
		oSipSessionOneCall.videoLocal = o_ConfigCall.video_local;
		// modify o_ConfigCall to oSession
		oSipSessionOneCall.videoRemote = oSession.videoRemote;
		oSipSessionOneCall.labelInfo = o_ConfigCall.label_info;
		oSipSessionOneCall.o_type = (o_ConfigCall.o_publish_subscribe_mode == "1")?'P':(o_ConfigCall.o_publish_subscribe_mode == "2")?'S':'D';
		// performance test analysis
		if(this.oInstance.isPerfTest){
			oSipSessionOneCall.perfVideo = this._newBatch(o_ConfigCall.video_Mode, o_ConfigCall.parent_div, o_ConfigCall.tag_name, o_ConfigCall.video_type, oSipSessionOneCall);
		}
		// Taurus.Feng.20140829 add handup id equral to o_SipSessionCall
		this.oInstance.rand++; // = this.rand + 1;
		oSipSessionOneCall.handup_id = this.oInstance.rand; 
		
		this.oCall = oSipSessionOneCall;
		return oSipSessionOneCall;
	};

}
confer_mgr_call.prototype = Object.create(confer_mgr_session.prototype);


/*===============================map list====================================*/
function Map(){
	var struct = function(key, value) {  
		this.key = key;  
		this.value = value;  
	};  
	// add key value  
	var put = function(key, value){  
		for (var i = 0; i < this.arr.length; i++) {  
			if ( this.arr[i].key === key ) {  
				this.arr[i].value = value;  
				return;  
			}  
		};  
		this.arr[this.arr.length] = new struct(key, value);  
	};  
	//  according key to value   
	var get = function(key) {  
		for (var i = 0; i < this.arr.length; i++) {  
			if ( this.arr[i].key === key ) {  
				return this.arr[i].value;  
			}  
		}  
		return null;  
	};  
	//  remove value according key  
	var remove = function(key) {  
		var v;  
		for (var i = 0; i < this.arr.length; i++) {  
			v = this.arr.pop();  
			if ( v.key === key ) {  
				continue;  
			}  
			this.arr.unshift(v);  
		}  
	};  
	var removeAll = function() {
		var v;
		for (var i = 0; i < this.arr.length; i++) {
			v = this.arr.pop();
			//this.arr.unshift(v);
		}
	}
	//  get map count
	var size = function() {  
		return this.arr.length;  
	};  
	// map is emply    
	var isEmpty = function() {  
		return this.arr.length <= 0;  
	};  
	// all values
	var values = function() {
		return this.attr;
	}
	this.arr = new Array();  
	this.get = get;  
	this.put = put;  
	this.remove = remove;  
	this.removeAll = removeAll;
	this.size = size;  
	this.isEmpty = isEmpty; 
	this.values = values; 
}

// load script tags
function add_js_script (srcP){
		var add_script = document.createElement("script");
		add_script.setAttribute('type', 'text/javascript');
		add_script.setAttribute('src', srcP);
		document.getElementsByTagName("head")[0].appendChild(add_script);
}
