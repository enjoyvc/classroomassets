
var ChatManagerModule = ChatManagerModule || {};

var editor;

function ChatManager(classRoomController){
	this.classRoomController = classRoomController;
    ChatManagerModule.instance = this;
    this.classroomInfoManager = classRoomController.getClassroomInfoManager();      //房间信息对象
    this.userObj = classRoomController.getUserManager();        //用户对象

    this.showChatView = true;          //是否显示聊天窗口,默认为true
    this.messageCount = 0;             //聊天信息总数
    this.messageWindowIsMax = false;     //聊天窗口是否最大化,默认false
}
var options = {
    minHeight : 65,
    minWidth : 216,
    resizeType : 1,
    cssData : '.ke-content { height:55px; width:206px; max-height:55px; max-width:206px; padding:5px; font:500 12px/20px SimSun; color:#999; background:#212121;}',
    allowPreviewEmoticons : false,
    allowImageUpload : false,
    afterFocus : function() {
        editor.sync();
        html = editor.html();
        if(html.indexOf(VC.ROUTER.LIVEBIG.TYPE_YOUR_TEXT_HERE) != -1){
            editor.html('');
        }
    },
    afterCreate:function(){
        var self=this;
        KindEditor.ctrl(self.edit.doc, 13, function() {
            self.sync();
            ChatManagerModule.instance._sendMessagePu();

        });
        ChatManagerModule.instance.showChatView = false;
    },
    items : []
};
KindEditor.ready(function(K) {
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
    constructor : ChatManager,
    init:function(){
    },
    getShowChatView : function(){       //获取聊天区显示状态
        return this.showChatView;
    },
    getMessageCount : function(){       //获取信息总数
        return this.messageCount;
    },
    messageCountIsNotEmpty : function(){    //信息总数是否不为空
        return this.messageCount > 0;
    },
    getMessageWindowIsMax : function(){     //获取聊天区是否最大化
        return this.messageWindowIsMax;
    },
    closeChatView : function(){     //关闭聊天窗口
        this.showChatView = false;
        if(this.getMessageWindowIsMax()){
            PublicStatic.StaticClass.minMessageWindowCss();
        }
        PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
    },
    clearMessage : function(){      //清除聊天信息
        $("#messages").html('');
        this.messageCount = 0;
    },
    maxMessageWindow : function(){   //最大化聊天窗口
        this.messageWindowIsMax = true;
        PublicStatic.StaticClass.maxMessageWindowCss();
        PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
    },
    minMessageWindow : function(){  //最小化聊天窗口
        this.messageWindowIsMax = false;
        PublicStatic.StaticClass.minMessageWindowCss();
        PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
        setTimeout(function(){
            ChatManagerModule.instance.talkScrollBar();
        },500);
    },
    openOrCloseChatView : function(){   //打开或关闭聊天窗口
        if(this.getShowChatView()){
            this.closeChatView();
        }else{
            this.showChatView = true;
            if(this.getMessageWindowIsMax()){
                PublicStatic.StaticClass.maxMessageWindowCss();
                PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
            }
            setTimeout(function(){
                ChatManagerModule.instance.talkScrollBar();
            },500);
        }
        this.messageCount = 0;
    },
    sendPublicMessage : function(){//发送公聊信息
        /*if(!ChatManagerModule.instance.userObj.isTeacher() && ChatManagerModule.instance.getQuota() > 10 &&
         ChatManagerModule.instance.isOpenClass() && ChatManagerModule.instance.getIsauth()==0){
         var msg = VC.ROUTER.LIVEBIG.CHATMANAGER_ISAUTH;
         ChatManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
         return;//暂时屏蔽非实名用户的限制(20150324)
         }*/
        ChatManagerModule.instance._sendMessagePu();//公聊
    },
    _sendMessagePu:function(){//公聊
        editor.sync();
        var messagejson = new Object();
        var temptalk = $("#talk").val();
        if (strIsEmpty(temptalk)) {
            return  false;
        }
        if(!ChatManagerModule.instance.userObj.isTeacher() && ChatManagerModule.instance.userObj.getBanChatStatus()){
            var msg = VC.ROUTER.LIVEBIG.CHATMANAGER_STUDENT_GAG;
            ChatManagerModule.instance.classroomInfoManager.showMessageWindow(msg);
            return  false;
        }
        messagejson.cmd = "chat:publictalk";
        messagejson.roomid = ChatManagerModule.instance.classRoomController.classRoomID;
        messagejson.userid = ChatManagerModule.instance.userObj.getUserid();
        messagejson.touserid = "";
        messagejson.message = $("#talk").val();
        messagejson.classroomName = ChatManagerModule.instance.classroomInfoManager.getClassroomName();
        ChatManagerModule.instance.classRoomController.sendMessage(messagejson);
        editor.html('');
    },
    talkScrollBar:function(){           //讨论区滚动条下滑
        var scrollPosition = $('#talkmain').height() - $('#cont').height();
        $('#cont').animate({scrollTop:scrollPosition},400);
    },
    privatetalkScrollBar:function(obj1,obj2){        //私聊区滚动条下滑
        obj1.scrollTop = obj2.offsetHeight-obj1.offsetHeight+5;
    },
    openPrivateMessageWindowToUser : function(user,username,avatar){//左侧列表,老师打开对其他人的私信窗口
        sendMessagePr(user,username,avatar);
    },
    onReceive:function(event){          //接收消息
        var data = JSON.parse(event);
        if (PublicStatic.StaticClass.validateByValue(data.touserid) && data.cmd == "chat:privatetalk"){ //私聊
            var tempMessage = "["+getTime()+"] ";
            var prtalkuser = null;
            if(ChatManagerModule.instance.userObj.isOneselfByUserid(data.userid)){      //私信别人
                tempMessage = tempMessage + VC.ROUTER.LIVEBIG.CHATMANAGER_I_SAY_TO + "<strong>" +data.tousername+ "</strong>" +VC.ROUTER.LIVEBIG.CHATMANAGER_SAY;
                prtalkuser = data.touserid;
            }else if(ChatManagerModule.instance.userObj.isOneselfByUserid(data.touserid)){      //别人对我的私信
                ChatManagerModule.instance.userObj.unshiftPrivateMessage(data);
                tempMessage = tempMessage +  "<strong>" +data.username+"</strong>" +VC.ROUTER.LIVEBIG.CHATMANAGER_SAY;
                prtalkuser = data.userid
            }
            var tempwname =''+map.get(prtalkuser)+'';
            var innermage = tempMessage + "<em>" +data.message +"</em>";
            if(window.frames[tempwname]){
                var para=document.createElement("p");
                para.innerHTML = innermage;
                window.frames[tempwname].document.getElementById('messages').appendChild(para);
                ChatManagerModule.instance.privatetalkScrollBar(window.frames[tempwname].document.getElementById('contpr'),window.frames[tempwname].document.getElementById('messages'));
            }else{
                innermage = "<p>" + innermage + "</p>";
                createPrtalkMain(data.touserid,prtalkuser, data.username , innermage,data.avatar);
            }
        }
        else if(/*data.cmd == "classroom:join" || data.cmd == "chat:quit" || */data.cmd == "chat:publictalk"){
            if(typeof data.isReConnect !== 'undefined' && data.isReConnect)return;//重连时不再显示加入
            var el = $('<div class="message" ><p></p></div>');
            var separator = "";
            var separatorend = "";
            if(data.cmd == "classroom:join"){
                separator = usernameStar(data.username);
                separatorend = VC.ROUTER.LIVEBIG.CHATMANAGER_JOIN;
                /*if(ChatManagerModule.instance.userObj.isOneselfByUserid(data.userid) && !data.isteacher && data.classroom.quota > 10 && data.classroom.ispublic && data.isauth == 0){//如果为大班公益课非实名用户
                 publicChatFlag = false;
                 $('#sentMessage').addClass('sent-g');//暂时屏蔽非实名用户的限制(20150324)
                 }*//*else if(!ChatManagerModule.instance.userObj.isOneselfByUserid(data.userid) && ChatManagerModule.instance.userObj.isTeacher()){//提示音
                 var chatA = $('#chatAudio')[0];
                 chatA.volume = 0.3;
                 chatA.load();
                 chatA.play();
                 }*/
            }else if(data.cmd == "chat:quit"){
                separator = usernameStar(data.username);
                separatorend =VC.ROUTER.LIVEBIG.CHATMANAGER_CLASS_QUIT;
            }else if(data.cmd == "chat:publictalk"){
                ChatManagerModule.instance.messageCount++;
                if(ChatManagerModule.instance.userObj.isOneselfByUserid(data.userid)){
                    separator = VC.ROUTER.LIVEBIG.LIVE_CHATMANAGER_I+"<i>"+VC.ROUTER.LIVEBIG.LIVE_CHATMANAGER_SAY+"</i>";
                }else{
                    separator = usernameStar(data.username)+"<i>"+VC.ROUTER.LIVEBIG.LIVE_CHATMANAGER_SAY+"</i>";
                }
            }
            var tmessage = PublicStatic.StaticClass.validateByValue(data.message)?data.message:"";
            var tempmessage ="["+getTime()+"] "+ "<em>" + separator + "</em>" + "<strong>" + tmessage +"</strong>" + separatorend;
            $("p", el).html(tempmessage);
            $(el).addClass(data.kind);
            if (ChatManagerModule.instance.userObj.isOneselfByUserid(data.userid))
                $(el).addClass('me');
            $('#messages').append(el);
            ChatManagerModule.instance.talkScrollBar();
            var div = document.getElementById('talkmain');
            div.scrollTop = div.scrollHeight;
        }      
    }
};
var usernameStar = function(username){
    var name = username;
    if(name!=null && name.length>5){
        name = name.substring(0,6) + "***";
    }
    return name;
};
strIsEmpty = function(str){
    var str = str.replace(/(&nbsp;)|(<p>)|(<\/p>)|(\/n)|(\/t)|(<br \/>)|\s|\u00a0/g,'');
    return str == null || !str || typeof str == undefined || str == '' || str.indexOf(VC.ROUTER.LIVEBIG.TYPE_YOUR_TEXT_HERE) != -1;
};

srtIsCzt = function(str){  
    return str.indexOf('传纸条') != -1;  
};

function StringBuffer() {
	this.__strings__ = [];
};

StringBuffer.prototype.append = function(str) {
	this.__strings__.push(str);
};

StringBuffer.prototype.toString = function() {
	return this.__strings__.join('');
};

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

function sendMessagePr(user,username,avatar)
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
        art.dialog.data('avatar',avatar);
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

var sendMessageprtalk = function(prinput,prtalkuser,avatar) {

	if (strIsEmpty(prinput)) { 
	    return  false;   
	}
	
	var messagejson = new Object();

	messagejson.cmd = "chat:privatetalk";
	messagejson.roomid = ChatManagerModule.instance.classRoomController.classRoomID;
	messagejson.userid = ChatManagerModule.instance.userObj.getUserid();
	messagejson.touserid  = prtalkuser; 
	messagejson.message =  prinput;
    messagejson.classroomName = ChatManagerModule.instance.classroomInfoManager.getClassroomName();
    messagejson.avatar = avatar;
    ChatManagerModule.instance.classRoomController.sendMessage(messagejson);
};

function HashMap() {
	this._size = 0;
	this.map = new Object();
};

HashMap.prototype.put = function(key, value) {
	if (!this.map[key]) {
		this._size++;
	}
	this.map[key] = value;
};

HashMap.prototype.get = function(key) {
	return this.isKey(key) ? this.map[key] : null;
};

HashMap.prototype.isKey = function(key) {
	return (key in this.map);
};

HashMap.prototype.remove = function(key) {
	if (this.isKey(key) && (delete this.map[key])) {
		this._size--;
	}
};

HashMap.prototype.size = function() {
	return this._size;
};

HashMap.prototype.find = function(_callback) {
	for ( var _key in this.map) {
		_callback.call(this, _key, this.map[_key]);
	}
};
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
