var ret_code;
var MCU_VER = 2;
function ConferenceManager2() {
    var MEDIA_PUBLISH = 'P';
    var MEDIA_SUBSCRIBE = 'S';
    var MEDIA_VIDEO = 'video';
    var MEDIA_AUDIO = 'audio';
    ret_code = {
        STATUS_NO: 0,
        REG_FAIL: 1010,
        REG_ING: 1011,
        REG_OK: 1012,
        REG_EXPIRES: 1013,
        UNREG_FAIL: 1020,
        UNREG_ING: 1021,
        UNREG_OK: 1022,
        UNREG_INFO: 1023,
        ROOM_FAIL: 2010,
        ROOM_ING: 2011,
        ROOM_NOT: 2012,
        ROOM_OK: 2013,
        CALL_FAIL: 3010,
        CALL_ING: 3011,
        CALL_SEND: 3012,
        CALL_SET: 3013,
        CALL_OK: 3014,
        CALL_MEDIA: 3015,
        CALL_INCOME: 3016,
        CALL_ERROR: 3017,
        CALL_LOFAIL: 3018,
        CALL_ROFAIL: 3019,
        MEET_FAIL: 4010,
        MEET_OTHER: 4011,
        MEET_LIST: 4012,
        MEET_NOT: 4013,
        MEET_COME: 4014,
        MEET_EXIST: 4015,
        MEET_JOIN: 4016,
        MEET_LEAVE: 4017,
        MEET_CREATE: 4018,
        MEET_DELELE: 4019,
        MEET_INFO: 4020,
        MEET_CTRL: 4021,
        HANGUP_FAIL: 5010,
        HANGUP_ING: 5011,
        HANGUP_OK: 5012,
        SIP_INFO: 6010,
        SIP_MESSAGE: 6011,
        SIP_INVITE: 6012,
        MEIDA_ACCEPT: 7010,
        MEDIA_REJECT: 7011,
        IM_INCOME: 8010,
        STACK_FAIL: 9010,
        STACK_ING: 9011,
        STACK_OK: 9012,
        BUDD_FAIL: 10010,
        BUDD_ADD: 10011,
        BUDD_GET: 10012,
        BUDD_DEL: 10013,
        BUDD_LIST: 10014,
        BUDD_INIT: 10015,
        BUDD_MGR: 10016,
        USER_OBJ: 11000
    };

    var This_ = this;
    var cbMsgInfo_ = null;
    var userName_;
    var roomName_;
    var room_;
    var oReadyStateTimer_;
    //var localVideoStream_ = new Array(2);
    //var Streams_ = [];

    var devices_info_ = {
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
    };
/*
    var findLocalStream = function (streamID) {
        if (!room_)
            return -1;
        return findStream(streamID, room_.localStreams);
    }

    var findRemoteStream = function (streamID) {
        if (!room_)
            return -1;
        return findStream(streamID, room_.remoteStreams);
    }

    var findStream = function (streamID, Streams) {
        for (var i = 0; i < Streams.length; i++) {
            if (streamID == Streams[i].getID())
                return i;
        }
        return 0;
    }
*/
    /*
    var deleteLocalStream = function (streamID) {
        if (!room_)
            return -1;
        return deleteStream(streamID, room_.localStreams);
    }

    var deleteRemoteStream = function (streamID) {
        if (!room_)
            return -1;
        return deleteStream(streamID, room_.remoteStreams);
    }

    var deleteStream = function (streamID, Streams) {
        var i = findStream(streamID, Streams);
        if (i < 0)
            return;
        Streams.splice(i, 1);
    }
    */
    var gotDevicesSources = function (sourceInfos) {
        for (var index = 0; index != sourceInfos.length; ++index) {

            var sourceInfo = sourceInfos[index];
            if (sourceInfo.kind === 'audio' || sourceInfo.kind === 'audioinput') {
                devices_info_.audioSource[devices_info_.posA] = sourceInfo.deviceId;
                console.log('video source: ', devices_info_.audioSource[devices_info_.posA]);
                devices_info_.posA++;

            } else if (sourceInfo.kind === 'video' || sourceInfo.kind === 'videoinput') {

                devices_info_.videoSource[devices_info_.posV] = sourceInfo.deviceId;
                console.log('video source: ', devices_info_.videoSource[devices_info_.posV]);
                devices_info_.posV++;

            } else {
                console.log('Some other kind of source: ', sourceInfo);
            }
        }
        if (devices_info_.callback !== undefined) {
            devices_info_.callback(devices_info_.CB_DEVICES,
				{ 'video': devices_info_.videoSource, 'audio': devices_info_.audioSource });
        }
    }
    var checkInit = function (callback) {
        try {
            devices_info_.videoSource = new Array();
            devices_info_.videoStream = new Array();
            devices_info_.audioSource = new Array();
            devices_info_.audioStream = new Array();
            //devices_info_.audio_context = new AudioContext;
            devices_info_.posV = 0;
            devices_info_.posA = 0;
            devices_info_.callback = callback || undefined;

            if (devices_info_.callback === undefined) {
                console.log("Please setup callback parameter for check devices");
            }

            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));

        } catch (e) {
            console.log('No web audio support in this browser!');
        }


        if (typeof MediaStreamTrack === 'undefined') {
            console.log('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
        } else {
            if (MediaStreamTrack.getSources)
                MediaStreamTrack.getSources(gotDevicesSources);
            else
                navigator.mediaDevices.enumerateDevices().then(gotDevicesSources);
            devices_info_.inited = true;
        }
    }

    var createToken = function (roomData, callback) {
        var req = new XMLHttpRequest();
        var url = 'https://vccamp.vccore.com/cloud/'+ 'createToken/';

        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                callback(req.responseText);
            }
        };

        req.open('POST', url, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(roomData));
    };

    this.appInit = function (oParam) {
        cbMsgInfo_ = oParam.cb_MsgInfo;
        if (oParam.cb_CheckMedia)
            checkInit(oParam.cb_CheckMedia);

        oReadyStateTimer = setInterval(function () {
            if (document.readyState === "complete") {
                clearInterval(oReadyStateTimer);
                var audio_tag = document.createElement("div");
                audio_tag.id = "audio_div";
                document.body.appendChild(audio_tag);
                cbMsgInfo_(ret_code.STACK_ING, 'inited');
            }
        },
		500);
    }

    this.sipRegister = function (oExpertP) {
        userName_ = oExpertP.id_DisplayName;
        cbMsgInfo_(ret_code.REG_OK, 'registered');
    }

    this.sipMeetingCreate = function(to_number, room_id, scheme) {
        roomName_ = room_id;
        var jsonObject = { param: { result: 0 } };
        cbMsgInfo_(ret_code.MEET_CREATE, 'Create meeting OK ', jsonObject);
    }

    this.sipMeetingJoin = function (to_number, room_id) {
        roomName_ = room_id;
        var roomData = {
            username: 'gta',
			password: '1112',
            role: 'presenter',
            room: roomName_,
            type: 'erizo',
            mediaConfiguration: 'default'
        };

        createToken(roomData, function (response) {
            var token = response;
            console.log(token);
            room_ = Erizo.Room({ token: token });
            room_.addEventListener('room-connected', function (roomEvent) {
                Streams_ = roomEvent.streams;
                var jsonObject = { param: { result: 0 } };
                cbMsgInfo_(ret_code.MEET_JOIN, 'Join meeting OK ', jsonObject);
            });

            room_.addEventListener('stream-subscribed', function (streamEvent) {
                var stream = streamEvent.stream;
                var remote = room_.remoteStreams.get(stream.getID());
                if (remote && remote.o_session) {
                    //handle subscribe
                    stream = remote;
                    stream.o_session.source_id = stream.getID().toString();
                    stream.o_session.tag.srcObject = stream.stream;
                    //stream.o_session.tag.src = URL.createObjectURL(stream.stream);
                    cbMsgInfo_(ret_code.CALL_SET, 'subscribe video get sourceID ', stream.o_session);
                    cbMsgInfo_(ret_code.CALL_OK, 'subscribe video OK ', stream.o_session);
                }
            });

            room_.addEventListener('stream-added', function (streamEvent) {
                var stream = streamEvent.stream;
                var local = room_.localStreams.get(stream.getID());
                if (local && local.o_session) {
                    //handle publish
                    stream = local;
                    stream.o_session.source_id = stream.getID().toString();
                    cbMsgInfo_(ret_code.CALL_SET, 'publish video get sourceID ', stream.o_session);
                    cbMsgInfo_(ret_code.CALL_OK, 'publish video OK ', stream.o_session);
                }
            });

            room_.addEventListener('stream-removed', function (streamEvent) {
                console.log('Stream removed, act accordingly');
                var stream = streamEvent.stream;
                if (stream && stream.o_session && stream.o_session.tag && stream.o_session.tag.id
                    && stream.o_session.o_SipSessionCall.mediaType.s_name == MEDIA_AUDIO) {
                    var child = document.getElementById(stream.o_session.tag.id);
                    child.parentNode.removeChild(child);
                }
            });

            room_.addEventListener('stream-failed', function (streamEvent) {
                console.log('Stream Failed, act accordingly');
            });

            room_.connect();
        });
    }

    this.sipUnRegister = function () {
        cbMsgInfo(ret_code.USER_OBJ, "oUser null");
    };

    this.sipCreateVideoTag = function (divname, tag, nm, rand, w, h) {
        var mydiv = document.getElementById(divname);
        var tVideo = document.createElement(tag);
        tVideo.class = "video";
        if (typeof (globalUI) == "undefined") {
            tVideo.width = w ? w : "640";
            tVideo.height = h ? h : "480";
        }
        else {

        }
        tVideo.id = "video_" + nm + '_' + rand;
        tVideo.autoplay = "autoplay";
        //tVideo.style.opacity = 0;
        //tVideo.style.visibility = 'hidden';
        //tVideo.setAttribute('autoplay', 'autoplay');
        tVideo.setAttribute('playsinline', 'playsinline');
        //tVideo.controls = "true";
        tVideo.muted = "false";
        //tVideo.onclick = this.toggleFullScreen; //add fullscreen
        mydiv.appendChild(tVideo);
        return tVideo;
    }

    this.sipCreateAudioTag = function (divname, rand) {
        var mydiv = document.getElementById(divname);
        var tVideo = document.createElement("audio");
        tVideo.id = "audio_"+ rand;
        tVideo.autoplay = "autoplay";
        //tVideo.setAttribute('playsinline', 'playsinline');
        //tVideo.controls = "true";
        //tVideo.muted = "false";
        //tVideo.onclick = this.toggleFullScreen; //add fullscreen
        mydiv.appendChild(tVideo);
        return tVideo;
    }

    this.sipPublishCall = function (s_type, room_id, o_ConfigMoreCall, cbCallInfo) {
        var mediaType = s_type == 'call-video' ? MEDIA_VIDEO : MEDIA_AUDIO;
        var videoConfig = { audio: false, video: true, data: false, screen: false };
        var deviceIndex = (typeof (o_ConfigMoreCall[0].device_index) != 'undefined') ? o_ConfigMoreCall[0].device_index : 0;
        var jsonObject = { labelInfo: o_ConfigMoreCall[0].label_info, o_type: MEDIA_PUBLISH, o_SipSessionCall: { mediaType: { s_name: mediaType } } };
        if (mediaType == MEDIA_VIDEO) {
            videoConfig.audio = false;
            //videoConfig.video = true;
            //videoConfig.screen = true;
            videoConfig.video = { deviceId: { exact: devices_info_.videoSource[deviceIndex] } };
        }
        else {
            videoConfig.audio = true;
            videoConfig.video = false;
        }
        var localVideoStream = Erizo.Stream(videoConfig);
        localVideoStream.o_session = jsonObject;
        localVideoStream.init();
        localVideoStream.addEventListener('access-accepted', function () {
            if (o_ConfigMoreCall[0].video_local) {
                o_ConfigMoreCall[0].video_local.srcObject = localVideoStream.stream;
                //o_ConfigMoreCall[0].video_local.src = URL.createObjectURL(localVideoStream.stream);
            }
            var options = { forceTurn: true, metadata: { type: 'publisher',area: room_.clientArea } };
            room_.publish(localVideoStream, options);

            cbMsgInfo_(ret_code.CALL_MEDIA, 'publish start ', jsonObject);
        });
        return localVideoStream;
    }

    this.publishSipHangUp = function (room_id, call_PhoneNumber) {
        var stream = room_.localStreams.get(call_PhoneNumber.getID());
        if (!stream)
            return;
        cbMsgInfo_(ret_code.HANGUP_ING, 'unpublish OK',stream.o_session);
        stream.close();
    }
    this.subscribeSipHangUp = function (room_id, call_PhoneNumber) {
        var stream = room_.remoteStreams.get(call_PhoneNumber.getID());
        if (!stream && stream.o_session)
            return;
        cbMsgInfo_(ret_code.HANGUP_ING, 'unpublish OK', stream.o_session);
        stream.close();
    }

    this.sipSubscribeCall = function (s_type, room_id, o_ConfigMoreCall) {
        var mediaType = s_type == 'call-video' ? MEDIA_VIDEO : MEDIA_AUDIO;
        var configMoreCall = o_ConfigMoreCall[0];
        var stream = room_.remoteStreams.get(configMoreCall.call_PhoneNumber);
        if (!stream)
            return;
        var tag = configMoreCall.video_remote ? configMoreCall.video_remote :configMoreCall.audio_remote;
        var jsonObject = { tag: tag, labelInfo: configMoreCall.label_info, o_type: MEDIA_SUBSCRIBE, o_SipSessionCall: { mediaType: { s_name: mediaType } } };
        stream.o_session = jsonObject;
        room_.subscribe(stream, {forceTurn: true, metadata: {type: 'subscriber', area: room_.clientArea}});
        cbMsgInfo_(ret_code.CALL_MEDIA, 'subscribe start ', jsonObject);
        return stream;
    }
}

var cfManager = new ConferenceManager2();

