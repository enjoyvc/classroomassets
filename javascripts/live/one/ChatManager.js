
var ChatManagerModule = ChatManagerModule || {};

var editor;

var publicChatFlag = true;

var param;

var role;

var isteacher = true; 

var classroomName = '';

function ChatManager(classRoomController){
	this.classRoomController = classRoomController;
    ChatManagerModule.instance = this;
}

var options = {
    minHeight : 65,
    minWidth : 216,
    resizeType : 1,
    cssData : '.ke-content { height:55px; width:206px; max-height:55px; max-width:206px; padding:5px; font:500 12px/20px SimSun; color:#999; background:#212121;}',
    allowPreviewEmoticons : false,
    allowImageUpload : false,
    afterFocus : function() {
        var self=this;
        self.sync();
        html = self.html();
        if(html.indexOf(VC.ROUTER.LIVEBIG.TYPE_YOUR_TEXT_HERE) != -1){
            self.html('');
        }
    },
    afterCreate:function(){
        var self=this;
        KindEditor.ctrl(self.edit.doc, 13, function() {
            self.sync();
            ChatManagerModule.instance._sendMessagePu();
        });
        ChatManagerModule.instance.kindEditorInitEnd();
    },
    items : []
};
KindEditor.ready(function(K) {          //默认编辑器
    editor = K.create('#talk', options);
    var emotions;
    K('#emotions').bind('click', function(e) {
        CreateEmotionsPanel("talk", "emotionsContent");
    });
    K("#emotionsContent").hide();
    K(document).click(function() {
        if (emotions) {
            emotions.remove();
            emotions = null;
        }
    });
});

ChatManager.prototype = {
    //--由liveController实现的方法区--start
    kindEditorInitEnd:function(){
        //TODO::通知controller，编辑器已经初始化完(因为默认隐藏编辑器，初始化会报错,所以先显示，初始化完再通知隐藏)
    },
    showMessageWindow:function(msg){
        //TODO::弹出提示框
    },
    talkScrollBar:function(){           //讨论区滚动条下滑
        var scrollPosition = $('#talkmain').height() - $('#cont').height();
        $('#cont').animate({scrollTop:scrollPosition},400);
    },
    //--由liveController实现的方法区--end
		init:function(){
			// TODO::初始化
            param = $('#userid').val();
            role = $("#role").val();
			this._bindEvent();
		},
		onReceive:function(classRoom){
			// TODO::接受服务器端的回调
			this._parseJSON(classRoom);
		},
		_render:function(){
			// TODO::渲染视图
		},
		// TODO::绑定事件
		_bindEvent:function(){
			 var parent = this;
			 $("#sentMessage").bind('click',function(){         //发送聊天信息
				 parent._sendMessagePu();
			 });
		},
		 _sendMessage:function(data){
			 ChatManagerModule.instance.classRoomController.sendMessage(data);
		},
		 _sendMessagePu:function() {
			var parent = this; 
			
			editor.sync();
			var messagejson = new Object();
			var temptalk = $("#talk").val();
			if (strIsEmpty(temptalk)) { 
			    return  false;   
			}
			if(!publicChatFlag){
                var msg = VC.ROUTER.LIVEBIG.CHATMANAGER_STUDENT_GAG;
                //alert(msg);
                ChatManagerModule.instance.showMessageWindow(msg);
				return  false;
			}

			messagejson.cmd = "chat:publictalk";
			messagejson.roomid = ChatManagerModule.instance.classRoomController.classRoomID;
			messagejson.userid = param;
			messagejson.touserid = ""; 
			messagejson.message = $("#talk").val();
            messagejson.classroomName = classroomName;
			parent._sendMessage(messagejson); 
			
			editor.html('');
		},
		_parseJSON:function(event){
            var membersSize = 0;
            var data = JSON.parse(event);
            if (data!=null) {
                //membersSize =	data.members.length - 1;
                this._parseJSONtea(data);
            }
            var variable = data.touserid;
            if (variable !== null && variable !== undefined && variable !== '' && data.cmd == "chat:privatetalk") {
                if (variable == param || data.userid == param) {
                    var tempMessage = "["+getTime()+"] "+(data.userid==param ? VC.ROUTER.LIVEBIG.CHATMANAGER_I_SAY_TO : "<strong>" +data.username+"</strong>")+(variable==param ? "" :"<strong>" +data.tousername+ "</strong>"  )+VC.ROUTER.LIVEBIG.CHATMANAGER_SAY;

                    var prtalkuser = (data.userid==param ? data.touserid : data.userid);
                    var winname = map.get(prtalkuser);
                    var tempwname =''+winname+'';
                    var innermage = tempMessage + "<em>" +data.message +"</em>";
                    if(window.frames[tempwname]){
                        var para=document.createElement("p");
                        para.innerHTML = innermage;
                        window.frames[tempwname].document.getElementById('messages').appendChild(para);
                    }else{
                        innermage = "<p>" + innermage + "</p>";
                        createPrtalkMain(variable,prtalkuser, data.username , innermage,data.avatar);
                    }
                }
            }
            else if(/*data.cmd == "classroom:join" || data.cmd == "chat:quit" || */data.cmd == "chat:publictalk"){
                var el = $('<div class="message" ><p></p></div>');
                var separator = "";
                var separatorend = "";
                if(data.cmd == "classroom:join"){
                    classroomName = data.classroom.name;
                    separator = usernameStar(data.username);
                    separatorend =VC.ROUTER.LIVEBIG.CHATMANAGER_JOIN;
                    if(role == 1)
                        $("#onlinenumber").html(VC.ROUTER.LIVEBIG.CHATMANAGER_CLASS_STUDENT+"("+membersSize+")");
                    else
                        $("#onlinenumber").html(VC.ROUTER.LIVEBIG.CHATMANAGER_CLASS_MEMBERS+"("+membersSize+")");
                    if(data.userid == param && !data.isteacher && data.classroom.quota > 10 && data.classroom.ispublic && data.isauth == 0){
                        publicChatFlag = false;
                    }
                    /*if(data.userid!=param && role == 1){//提示音
                        var chatA = $('#chatAudio')[0];
                        chatA.volume = 0.3;
                        chatA.load();
                        chatA.play();
                    }*/
                }else if(data.cmd == "chat:quit"){
                    separator = usernameStar(data.username);
                    separatorend =VC.ROUTER.LIVEBIG.CHATMANAGER_CLASS_QUIT;
                    total = data.total;
                }else if(data.userid == param){
                    separator = VC.ROUTER.LIVEBIG.LIVE_CHATMANAGER_I+"<i>"+VC.ROUTER.LIVEBIG.LIVE_CHATMANAGER_SAY+"</i>";
                }else{
                    separator = usernameStar(data.username)+"<i>"+VC.ROUTER.LIVEBIG.LIVE_CHATMANAGER_SAY+"</i>";
                }
                if(typeof data.isReConnect !== 'undefined' && data.isReConnect)return;
                var tmessage = data.message ==null || data.message == undefined  || data.message =='' ? "" : data.message;
                var tempmessage;
                if (data.userid == param){
                	tempmessage ="["+getTime()+"] "+ "<em>" + separator + "</em>" + "<strong>" + tmessage +"</strong>" + separatorend;
                }else{
                	tempmessage ="["+getTime()+"] "+ "<em>" + separator + "</em>" + "<strong>" + tmessage +"</strong>" + separatorend;
                }   
                $("p", el).html(tempmessage);
                $(el).addClass(data.kind);
                if (data.userid == param)
                    $(el).addClass('me');
                $('#messages').append(el);
                ChatManagerModule.instance.talkScrollBar();
            }
            if (data.cmd == "userctrl:stopchat" ) {
                if(data.userid == param && data.status == 1){
                    publicChatFlag = false;
                }else if(data.userid == param && data.status == 0){
                    publicChatFlag = true;
                }
            }
            var div = document.getElementById('talkmain');
            div.scrollTop = div.scrollHeight;
    },
    onCallBack:function(members){
        //TODO::等待调用者实现
    },
    _parseJSONtea:function(data){
        ChatManagerModule.instance.onCallBack(data);
    }

};
var usernameStar = function(username){
    var name = username;
    if(name.length>5){
        name = name.substring(0,6) + "***";
    }
    return name;
};
strIsEmpty = function(str){
    var str = str.replace(/(&nbsp;)|(<p>)|(<\/p>)|(\/n)|(\/t)|(<br \/>)|\s|\u00a0/g,'');
    return str == null || !str || typeof str == undefined || str == '' || str.indexOf(VC.ROUTER.LIVEBIG.TYPE_YOUR_TEXT_HERE) != -1;
} 

srtIsCzt = function(str){  
    return str.indexOf('传纸条') != -1;  
} 

function StringBuffer() {
	this.__strings__ = [];
};

StringBuffer.prototype.append = function(str) {
	this.__strings__.push(str);
};

StringBuffer.prototype.toString = function() {
	return this.__strings__.join('');
}; 


function showPrtalk(prtalkname) {
	var prtalkwindows = map.get(prtalkname);
	if (!_show) {
		if (window.frames[prtalkwindows]) {
			window.frames[prtalkwindows].show();
		}
		_show = true;
	} else {
		_show = false;
		if (window.frames[prtalkwindows]) {
			window.frames[prtalkwindows].hide();
		}
	}
} 

var windowtotal  = 1;
function getRelatives(coordinates){
	var windowCoor;
	if(coordinates > 49)
	windowCoor =coordinates + windowtotal * 1.2;
	else
	windowCoor =coordinates + windowtotal * 3;	
	windowtotal++;
	return windowCoor;
}

function sendMessagePr(user,username)
{
	//updateMessageTag(user,username);
	var tempwname = map.get(user);
	if (window.frames[tempwname]) { 
	    window.frames[tempwname].show();		   	
	} else {
		var def = art.dialog.defaults;  
		var relativeLeft = getRelatives(50)+'%';
		var relativetop = getRelatives(37)+'%';
		def.left= relativeLeft;
		def.top= relativetop;
        art.dialog.data('privatetalktype',VC.ROUTER.LIVEBIG.LIVE_PRIVATE_TALK);
		art.dialog.data('prtalkuser', user);
		art.dialog.data('prtalkusername', username);
        var temphtml = 'messagepr';
        if(VC.ROUTER.LIVEBIG.PUBLIC_KEY !== 'cn'){
            temphtml = temphtml + '_' + VC.ROUTER.LIVEBIG.PUBLIC_KEY;
        }
        temphtml = temphtml + '.html';
        art.dialog.open(temphtml, null , false);
		
	}
}

function createPrtalkMain(touserid,user,username,message,avatar)
{
	var userid = $("#userid").val();

	if (userid == touserid) {
        art.dialog.data('privatetalktype',VC.ROUTER.LIVEBIG.LIVE_PRIVATE_TALK);
		art.dialog.data('prtalkuser', user);
		art.dialog.data('prtalkusername', username);
        art.dialog.data('avatar', avatar);
		art.dialog.data('message', message);
        var temphtml = 'messagepr';
        if(VC.ROUTER.LIVEBIG.PUBLIC_KEY !== 'cn'){
            temphtml = temphtml + '_' + VC.ROUTER.LIVEBIG.PUBLIC_KEY;
        }
        temphtml = temphtml + '.html';
        art.dialog.open(temphtml, {show:false, init: function () { initPrtalkMeg();}}, false);
	}
}

function initPrtalkMeg(){}

function getTime(){
    var d = new Date();
    var hms = checkTime(d.getHours()) + ":" + checkTime(d.getMinutes());  
    return hms
}
function checkTime(i) {
	if (i < 10) {
		i = "0" + i
	}
	return i
} 

var map =new HashMap();

var setPrtalkWinHashMap = function(prtalkname,prtalkwindows) {
	
	map.put(prtalkname,prtalkwindows);
	
}

var sendMessageprtalk = function(prinput,prtalkuser) {

	if (strIsEmpty(prinput)) { 
	    return  false;   
	}
	
	var messagejson = new Object();

	messagejson.cmd = "chat:privatetalk";
	messagejson.roomid = ChatManagerModule.instance.classRoomController.classRoomID;
	messagejson.userid = param;
	messagejson.touserid  = prtalkuser; 
	messagejson.message =  prinput; 
	messagejson.classroomName = classroomName;
	ChatManagerModule.instance._sendMessage(messagejson);
}

function HashMap() {
	this._size = 0;
	this.map = new Object();
}

HashMap.prototype.put = function(key, value) {
	if (!this.map[key]) {
		this._size++;
	}
	this.map[key] = value;
}

HashMap.prototype.get = function(key) {
	return this.isKey(key) ? this.map[key] : null;
}

HashMap.prototype.isKey = function(key) {
	return (key in this.map);
}

HashMap.prototype.remove = function(key) {
	if (this.isKey(key) && (delete this.map[key])) {
		this._size--;
	}
}

HashMap.prototype.size = function() {
	return this._size;
}

HashMap.prototype.find = function(_callback) {
	for ( var _key in this.map) {
		_callback.call(this, _key, this.map[_key]);
	}
}
//表情
function _getBasePath() {
	var els = document.getElementsByTagName('script'), src;
	for (var i = 0, len = els.length; i < len; i++) {
		src = els[i].src || '';
		if (/kindeditor[\w\-\.]*\.js/.test(src)) {
			return src.substring(0, src.lastIndexOf('/') + 1);
		}
	}
	return '';
}
//表情
function CreateEmotionsPanel(divEmotion,emotionsPanel)
        {
            if($("#"+emotionsPanel).is(':visible')){
				$("#"+emotionsPanel).hide()
			}else{
			    $("#"+emotionsPanel).show()
			}
            document.getElementById(emotionsPanel).innerHTML = "";
            var K = KindEditor;
            var self = this, name = 'emoticons',
		                path = (_getBasePath() +'plugins/emoticons/images/'),
		                allowPreview = self.allowPreviewEmoticons === undefined ? true : self.allowPreviewEmoticons,
		                currentPageNum = 1;

            var rows = 5, cols = 9, total = 135, startNum = 0,
			            cells = rows * cols, pages = Math.ceil(total / cells),
			            colsHalf = Math.floor(cols / 2),
			            elements = [];

            var wrapperDiv = K("#"+emotionsPanel);
            var previewDiv, previewImg;
            if (allowPreview) {
                previewDiv = K('<div class="ke-preview"></div>').css('right', 0);
                previewImg = K('<img class="ke-preview-img" src="' + path + startNum + '.gif" />');
                wrapperDiv.append(previewDiv);
                previewDiv.append(previewImg);
            }
            function bindCellEvent(cell, j, num) {
                if (previewDiv) {
                    cell.mouseover(function () {
                        if (j > colsHalf) {
                            previewDiv.css('left', 0);
                            previewDiv.css('right', '');
                        } else {
                            previewDiv.css('left', '');
                            previewDiv.css('right', 0);
                        }
                        previewImg.attr('src', path + num + '.gif');
                        K(this).addClass('ke-on');
                    });
                } else {
                    cell.mouseover(function () {
                        K(this).addClass('ke-on');
                    });
                }
                cell.mouseout(function () {
                    K(this).removeClass('ke-on');
                });
                cell.click(function (e) {
                	editor.sync();
                	html = editor.html();
					if(html.indexOf(VC.ROUTER.LIVEBIG.TYPE_YOUR_TEXT_HERE) != -1){
                    	editor.html('');
                    }
                	editor.insertHtml('<img src="' + path + num + '.gif" border="0" alt="" />');
                    document.getElementById(emotionsPanel).style.display = "none";
                    e.stop();
                });
            }
            function createEmoticonsTable(pageNum, parentDiv) {
                var table = document.createElement('table');
                 parentDiv.append(table);
                if (previewDiv) {
                    K(table).mouseover(function () {
                        previewDiv.show('block');
                    });
                    K(table).mouseout(function () {
                        previewDiv.hide();
                    });
                    elements.push(K(table));
                }
                table.className = 'ke-table';
                table.cellPadding = 0;
                table.cellSpacing = 0;
                table.border = 0;
                var num = (pageNum - 1) * cells + startNum;
                for (var i = 0; i < rows; i++) {
                    var row = table.insertRow(i);
                    for (var j = 0; j < cols; j++) {
                        var cell = K(row.insertCell(j));
                        cell.addClass('ke-cell');
                        bindCellEvent(cell, j, num);
                        var span = K('<span class="ke-img"></span>')
						.css('background-position', '-' + (24 * num) + 'px 0px')
						.css('background-image', 'url(' + path + 'static.gif)');
                        cell.append(span);
                        elements.push(cell);
                        num++;
                    }
                }
                return table;
            }
            var table = createEmoticonsTable(currentPageNum, wrapperDiv);
            function removeEvent() {
                K.each(elements, function () {
                    this.unbind();
                });
            }
            var pageDiv;
            function bindPageEvent(el, pageNum) {
                el.click(function (e) {
                    removeEvent();
                    table.parentNode.removeChild(table);
                    pageDiv.remove();
                    table = createEmoticonsTable(pageNum, wrapperDiv);
                    createPageTable(pageNum);
                    currentPageNum = pageNum;
                    e.stop();
                });
            }
            function createPageTable(currentPageNum) {
                pageDiv = K('<div class="ke-page"></div>');
                wrapperDiv.append(pageDiv);
                for (var pageNum = 1; pageNum <= pages; pageNum++) {
                    if (currentPageNum !== pageNum) {
                        var a = K('<a href="javascript:;">[' + pageNum + ']</a>');
                        bindPageEvent(a, pageNum);
                        pageDiv.append(a);
                        elements.push(a);
                    } else {
                        pageDiv.append(K('@[' + pageNum + ']'));
                    }
                    pageDiv.append(K('@&nbsp;'));
                }
            }
            createPageTable(currentPageNum);
}

$.extend({
    keytips:function(input){
        $(input).each(function (i) {
            if($.trim($(this).val())=='' || $.trim($(this).val())==$(this).attr("place")){
                $(this).val($(this).attr("place")).css('color','#aaa');
            }
            $(this).live('focusin', function () {
                if($.trim($(this).val())==$(this).attr("place")){
                    $(this).val('').css('color','#000');
                }
            });
            $(this).live('focusout', function () {
                if($.trim($(this).val())=='' || $.trim($(this).val())==$(this).attr("place")){                
                    $(this).val($(this).attr("place")).css('color','#aaa');
                }
            });
        });    
    }
});

$.keytips(".txt");
