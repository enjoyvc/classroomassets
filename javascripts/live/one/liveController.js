classRoomModule.controller('liveController',['$scope','liveFactory','$log','$sce','$interval','$timeout','$modal',
    function($scope,liveFactory,$log,$sce,$interval,$timeout,$modal){
    var classRoomControler = new ClassRoomController();
    classRoomControler.init();
    var classroomInfoManager = classRoomControler.getClassroomInfoManager();//会议室信息
    var whiteBoardManager = classRoomControler.getWhiteBoardManager();      //白板
    var chatManager = classRoomControler.getChatManager();                  //聊天
    var liveManager = classRoomControler.getLiveManager();                  //视频

    //常量区域
    var roleT = '1';        // 老师
    var roleS = '2';        // 学生
    var tpromise;           //老师定时器
    var spromise;           //学生定时器
    var clickVideoPromise = false;       //防止频繁点击本地视频设备
    var clickAudioPromise = false;       //防止频繁点击本地音频设备
    var controlAllVideoPromise = false;  //防止老师频繁点击控制学生摄像头
    var controlAllAudioPromise = false;  //防止老师频繁点击控制学生音频
    var clickVideoPromiseTime = 3000;
    var clickAudioPromiseTime = 3000;
    var controlAllVideoPromiseTime = 3500;
    var controlAllAudioPromiseTime = 3500;

    $scope.localUserid = $('#userid').val();        //本地userid
    $scope.localRole = $('#role').val();            //本地role
    $scope.localRoomid = $('#classRoomId').val();   //本地roomid
    $scope.localRealName = $('#realname').val();   //本地realname
//===重构========================================================================================================start

    //初始化区--------------------------------------------------------------------------start
    var chatInit = function(){          //聊天初始化
        vm.chat.showChatView = true;                //显示聊天窗口,默认为true
        vm.chat.messageCount = 0;                   //聊天信息总数
        vm.chat.controlChatStatus = true;           //记录控制讨论区发言状态
        vm.chat.messageWindowMinOrMax = 0;          //聊天窗口最大化或最小化，0：最小化，1：最大化
    };
    var whiteboardInit = function(){        //白板初始化
        vm.whiteboard.isOpenWhiteboard = false;          //是否开启白板,显示主画面白板，默认为false
        vm.whiteboard.isOpenTools = false;               //是否开启白板工具条,默认为false
        vm.whiteboard.isOpenShareWhiteboard = false;     //是否开启共享白板,默认为false
        vm.whiteboard.tools = {};                        //工具条,用于显示被隐藏的内容
        vm.whiteboard.tools.currentPage = 0;                   //白板当前页
        vm.whiteboard.tools.totalPage = 0;                     //白板总页数
        vm.whiteboard.tools.currentTool = 'pen';                //记录当前选中的是哪种工具,默认为pen
        vm.whiteboard.tools.color = false;                     //调色
        vm.whiteboard.tools.line = false;                       //线条选择
        vm.whiteboard.tools.lineValue = 1;                      //线条大小
        vm.whiteboard.tools.straightline = false;               //直线
        vm.whiteboard.tools.font = false;
    };
    var classroomInfoInit = function(){             //会议室信息初始化
        vm.classroomInfo.classroomName = null;          //课室名称
        vm.classroomInfo.hasmeeting = false;            //记录会议是否创建,默认为false
        vm.classroomInfo.classroomMode = 0;             //课堂模式,默认为0  0为授课模式，1为讨论模式
        vm.classroomInfo.searchKey = null;              //列表搜索关键字
        vm.classroomInfo.openClass = false;             //是否为公开课,默认为false
        vm.classroomInfo.classroomType = null;          //课堂类型  ，默认为空 ，1：一对一   10：小班  100：大班
        vm.classroomInfo.isShareVideo = false;          //老师是否共享屏幕
        vm.classroomInfo.teaWhiteboardStatus = false;   //记录老师是否开启白板
        vm.classroomInfo.data = null;                   //记录会议室的信息
        vm.classroomInfo.teacherCurrentVideo = null;    //记录老师当前的视频
        vm.classroomInfo.HANDUPTIME = 60;               //举手时间
        vm.classroomInfo.showResolutionSelectView = false;//分辨率切换窗口显示状态,默认false
        vm.classroomInfo.currentResolution = 40;//LD:20 SD:40 HD:80
    };
    var teacherInfoInit = function(){               //教师信息初始化
        vm.teacherInfo.userid = null;                   //userid
        vm.teacherInfo.username = null;                 //username
        vm.teacherInfo.isOpenFirstVideo = false;        //是否打开第一个摄像头。默认false
        vm.teacherInfo.connectFirstVideo = false;       //是否连接了第一个视频设备
        vm.teacherInfo.isOpenSecondVideo = false;       //是否打开第二个摄像头。默认false
        vm.teacherInfo.connectSecondVideo = false;      //是否连接了第二个视频设备
        vm.teacherInfo.isOpenAudio = false;             //是否打开音频。默认false
        vm.teacherInfo.connectAudio = false;            //是否连接了麦克风。默认false
        vm.teacherInfo.controlVideo = 0;                //控制所有视频的开关。       1：禁止所有人视频   0：开启所有人视频    2:学生自己关闭视频,老师不能开启
        vm.teacherInfo.controlAudio = 0;                //控制所有音频的开关。       1：禁止所有人音频   0：开启所有人音频    2:学生自己关闭音频,老师不能开启
        vm.teacherInfo.onLineSelect = false;            //开启在线状态选择
        vm.teacherInfo.online = 0;                      //在线状态,默认为0
        vm.teacherInfo.privateMessage = [];             //私信列表
        vm.teacherInfo.isSubAudio = false;              //是否订阅过音频
        vm.teacherInfo.allowHandup = false;             //老师是否允许学生举手
        vm.teacherInfo.handupList = [];                 //存储举手学生
        vm.teacherInfo.handupListViewShow = false;      //举手学生列表窗口显示状态
        vm.teacherInfo.handupSelectStudent = [];        //存储学生举手列表中选择的学生
        vm.teacherInfo.avatar = "";                     //老师头像
    };
    var studentInfoInit = function(){               //学生信息初始化
        vm.studentInfo.userid = null;                   //userid
        vm.studentInfo.username = null;                 //username
        vm.studentInfo.isOpenVideo = false;             //是否打开视频。默认false
        vm.studentInfo.connectVideo = false;            //是否连接了视频设备
        vm.studentInfo.isOpenAudio = false;             //是否打开音频。默认false
        vm.studentInfo.connectAudio = false;            //是否连接了麦克风。默认false
        vm.studentInfo.isBanVideo = false;              //是否禁止视频。默认false
        vm.studentInfo.isBanAudio = false;              //是否禁止音频。默认false
        vm.studentInfo.onLineSelect = false;            //开启在线状态选择
        vm.studentInfo.online = 0;                      //在线状态,默认为0
        vm.studentInfo.isauth = 1;                      //1：实名用户  0：非实名用户
        vm.studentInfo.isHandup = false;                //是否举过手
        vm.studentInfo.privateMessage = [];             //私信列表
        vm.studentInfo.isSubAudio = false;              //是否订阅过音频
        vm.studentInfo.isBanChat = false;               //是否禁用聊天
        vm.studentInfo.teacherIsOpenAudio = false;      //老师是否打开音频
        vm.studentInfo.viewTeacherVideoShow = 1;        //学生界面老师视频显示
        vm.studentInfo.allowHandup = false;             //老师是否允许学生举手
        vm.studentInfo.isHandup = false;                //是否举过手
        vm.studentInfo.avatar = "";                     //学生头像
    };
    //初始化区----------------------------------------------------------------------------end

    var vm = $scope.vm = {};
    vm.classroomInfo = {};  //会议室信息
    vm.chat = {};           //聊天
    vm.whiteboard = {};     //白板
    vm.teacherInfo = {};    //用户为教师时信息
    vm.studentInfo = {};    //用户为学生时信息

    chatInit();
    whiteboardInit();
    classroomInfoInit();
    teacherInfoInit();
    studentInfoInit();
    //controller通信-----------------------------------------------------------------------start
    $scope.$on('leave',function(evt,args){
        liveManager.leaveClassroom();
    });
    //controller通信-----------------------------------------------------------------------end
    //公共私有方法区-------------------------------------------------------------------------start
    var _findMemberByUserId = function(userId, members){            //根据userid从members中找到对应的索引
        if(userId == null || userId === ""){
            return null;
        }
        var idx = null;
        $.each(members,function(index,member){
            if(member.userid == userId){
                idx = index;
            }
        });
        return idx;
    };
    var _findAvatarFromMemebersByUserid = function(userId,members){//根据userid从members中找到对应的头像
        if(userId == null || userId === ""){
            return null;
        }
        var avatar = null;
        $.each(members,function(index,member){
            if(member.userid == userId){
                avatar = member.avatar;
                return false;
            }
        });
        return avatar;
    };
    var _updateLocalMessageList = function(privateMessageList,userid){      //更新本地私聊信息
        if(typeof(userid) === 'undefined' || userid == null || userid === "")
            return;
        var tempList = [];
        $.each(privateMessageList,function(index,obj){
            if(obj.userid != userid){
                tempList.push(obj);
            }
        });
        return tempList;
    };
    var showMessageWindow = function(msg){//信息提示
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        var modalInstance = $modal.open({
            templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.OTHERMESSAGE,
            backdrop:'static',
            controller: 'windowMessageController',
            resolve: {
                data: function() {
                    var data = new Object();
                    data.message = msg;
                    return data;
                }
            }
        });
        return modalInstance;
    };
    var operationMessageWindow = function(msg){//操作提示
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        var modalInstance = $modal.open({
            templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.OPERATIONMESSAGE,
            backdrop:'static',
            controller: 'operationMessageController',
            resolve: {
                data: function() {
                    var data = new Object();
                    data.message = msg;
                    return data;
                }
            }
        });
        return modalInstance;
    };
    var openErrorWindow = function(msg){//错误提示
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        var modalInstance = $modal.open({
            templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.ERRORMESSAGE,
            backdrop:'static',
            controller: 'errorMessageController',
            resolve: {
                data: function() {
                    var data = new Object();
                    data.message = msg;
                    return data;
                }
            }
        });
        return modalInstance;
    };
    //公共私有方法区--------------------------------------------------------------------------end
    //会议室信息----------------------------------------------------------------------------start
    //ClassroomInfoManager待实现方法区--------------------------------------------start
    classroomInfoManager.setClassroomInfoData = function(data){             //记录data
        if(vm.classroomInfo.data==null)
            vm.classroomInfo.data = data;
    };
    classroomInfoManager.updateClassroomInfoDataOtherJoin = function(data){ //更新data
        var index = _findMemberByUserId(data.userid,vm.classroomInfo.data.members);
        if(index != null)
            vm.classroomInfo.data.members.splice(index,1);                  //删除旧的
        var idx = _findMemberByUserId(data.userid,data.members);
        if(idx != null){
            var memberObj = data.members[idx];
            vm.classroomInfo.data.members.push(memberObj);                  //添加新的
        }
    };
    classroomInfoManager.setCourseTitle = function(data){                   //设置课程标题
          vm.classroomInfo.classroomName = data;
          $scope.$emit('courseTitle',data);
    };
    classroomInfoManager.setClassroomType = function(typeValue){            //记录课程类型
        vm.classroomInfo.classroomType = typeValue;
    };
    classroomInfoManager.setClassroomMode = function(value){                //设置课堂模式
        vm.classroomInfo.classroomMode = value;
    };
    classroomInfoManager.setOpenClass = function(openClassValue){           //设置公开课
        vm.classroomInfo.openClass = openClassValue;
    };
    classroomInfoManager.setTeaWhiteboardStatus = function(status){     //设置开启白板
        vm.classroomInfo.teaWhiteboardStatus = status;
    };
    classroomInfoManager.setShareWhiteBoardStatus = function(status){       //设置共享白板
        vm.whiteboard.isOpenShareWhiteboard = status;
    };
    classroomInfoManager.setSharePCVideoStatus = function(status){          //设置共享屏幕状态
        vm.classroomInfo.isShareVideo = status;
    };
    classroomInfoManager.setCurrentVideo = function(value){
        vm.classroomInfo.teacherCurrentVideo = value;                       //老师主画面的视频id;老师：'t_1','t_2';学生：userid
    };
    classroomInfoManager.setHasmeeting = function(value){                   //记录会议室是否创建
        vm.classroomInfo.hasmeeting = value;
    };
    classroomInfoManager.setTeacherControlAllVideoStatus = function(value){     //记录老师控制所有学生视频的状态
        vm.teacherInfo.controlVideo = value;
        if($scope.localRole == roleT) {
            $.each(vm.classroomInfo.data.members, function (index, obj) {
                if (obj.roleid == 2) {
                    if (obj.stopvideo == 0) {
                        vm.teacherInfo.controlVideo = 2;
                    }
                }
            });
        }
    };
    classroomInfoManager.setTeacherControlAllAudioStatus = function(value){     //记录老师控制所有学生音频的状态
        vm.teacherInfo.controlAudio = value;
        if($scope.localRole == roleT){
            $.each(vm.classroomInfo.data.members,function(index,obj){
               if(obj.roleid == 2){
                   if(obj.stopspeak == 0){
                       vm.teacherInfo.controlAudio = 2;
                   }
               }
            });
        }
    };
    classroomInfoManager.setTeacherInfo = function(data){                   //记录老师信息
        vm.teacherInfo.userid = data.userid;
        vm.teacherInfo.username = data.username;
        var index = _findMemberByUserId(data.userid,vm.classroomInfo.data.members);
        if(index != null){
            vm.teacherInfo.online = vm.classroomInfo.data.members[index].online;
            vm.teacherInfo.avatar = vm.classroomInfo.data.members[index].avatar;
        }
    };
    classroomInfoManager.setStudentInfo = function(data){                   //记录老师信息
        vm.studentInfo.userid = data.userid;
        vm.studentInfo.username = data.username;
        vm.studentInfo.isauth = data.isauth;
        var index = _findMemberByUserId(data.userid,vm.classroomInfo.data.members);
        if(index != null){
            vm.studentInfo.online = vm.classroomInfo.data.members[index].online;
            vm.studentInfo.avatar = vm.classroomInfo.data.members[index].avatar;
        }
    };
    classroomInfoManager.setAllowHandup = function(status){                 //设置允许举手状态
        if($scope.localRole == roleS){
            vm.studentInfo.allowHandup = status;
        }
    };
    classroomInfoManager.setAllowHandupTime = function(value){
        if($scope.localRole == roleS){
            vm.classroomInfo.HANDUPTIME = value;
            spromise = $interval(function(){
                _HANDUPTIME_student_count();
            },1000);
        }
    };
    classroomInfoManager.cleanTeacherInfo = function(){             //清除老师信息
        vm.teacherInfo.userid = null;
        vm.teacherInfo.username = null;
        vm.teacherInfo.online = 0;
    };
    //ClassroomInfoManager待实现方法区--------------------------------------------end
    //会议室信息----------------------------------------------------------------------------end
    //聊天---------------------------------------------------------------------------------start
    vm.chat.openOrCloseChatView = function(){   //打开或关闭聊天窗口
        if(vm.chat.showChatView){
        //    _chatViewHide();
            vm.chat.closeChatView();
        }else{
            _chatViewShow();
            if(vm.chat.messageWindowMinOrMax == 1){
                PublicStatic.StaticClass.maxMessageWindowCss();
                PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
            }
            $timeout(function(){
                chatManager.talkScrollBar();
            },500);
        }
        vm.chat.messageCount = 0;
    };
    vm.chat.clearMessage = function(){          //清除聊天信息
        $("#messages").html('');
        vm.chat.messageCount = 0;
    };
    vm.chat.closeChatView = function(){          //关闭聊天窗口
        vm.chat.showChatView = false;
        if(vm.chat.messageWindowMinOrMax == 1){
            PublicStatic.StaticClass.minMessageWindowCss();
        }
        PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
    };
    vm.chat.messageCountStatus = function(){     //聊天信息是否大于0
        if(vm.chat.showChatView)
            vm.chat.messageCount = 0;
        return vm.chat.messageCount > 0;
    };
    vm.chat.maxMessageWindow = function(){      //最大化聊天窗口
        vm.chat.messageWindowMinOrMax = 1;
        PublicStatic.StaticClass.maxMessageWindowCss();
        PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
    };
    vm.chat.minMessageWindow = function(){
        vm.chat.messageWindowMinOrMax = 0;      //最小化聊天窗口
        PublicStatic.StaticClass.minMessageWindowCss();
        PublicStatic.StaticClass.changeMainScreenWidthAndHeight();
        $timeout(function(){
            chatManager.talkScrollBar();
        },500);

    };
    //ChatManager待实现的方法区---------------------------------------------------------------start
    chatManager.kindEditorInitEnd = function(){     //初始化完编辑器,隐藏聊天窗口
        vm.chat.showChatView = false;
    };
    chatManager.showMessageWindow = function(msg){      //弹出提示框
        return showMessageWindow(msg);
    };
    chatManager.onCallBack = function(data){        //接受服务器命令
        if(data.cmd == "classroom:join"){       //用户加入
            if (data.classroom.stime != 0 &&  data.classroom.etime != 0) {
                $scope.stime = data.classroom.stime;
                $scope.etime = data.classroom.etime;
            }
        }
        else if(data.cmd == "chat:publictalk"){            //公聊命令
            vm.chat.messageCount++;
        }
        else if (data.cmd == "robot:talk"){
            $scope.sertime = data.date;
            $scope.nowtime = $.now();
        }
        else if(data.cmd == "controlpanel:sharewhiteboard"){        //共享白板通知(此命令为老师通知所有学生开启共享白板)
            if($scope.localRole == roleT){              //如果老师收到此命令,则return
                return;
            }
            if(data.status == 1){               //学生收到后,判断为1开启白板共享，否则关闭
                var msg = VC.ROUTER.LIVEBIG.LIVE_WHITEBOARD_ON_TIPS;
                liveManager.showMessageWindow(msg);
                _whiteboardToolsOn();
                _whiteboardShareOn();
                _setAllMemberStopwhiteboard(1);
            }else{
                var msg = VC.ROUTER.LIVEBIG.LIVE_WHITEBOARD_OFF_TIPS;
                liveManager.showMessageWindow(msg);
                _whiteboardToolsOff();
                _whiteboardShareOff();
                _setAllMemberStopwhiteboard(0);
            }
        }
        else if(data.cmd === "userctrl:stopchat"){     //禁止或允许用户讨论区发言
            var toIndex = _findMemberByUserId(data.userid,vm.classroomInfo.data.members);
            if(toIndex != null){
                if(data.status === 1){                  //0:开  1:禁
                    vm.classroomInfo.data.members[toIndex].stopchat = 1;
                    if(role == roleS && data.userid == $scope.localUserid)
                        vm.studentInfo.isBanChat = true;
                }else{
                    vm.classroomInfo.data.members[toIndex].stopchat = 0;
                    if(role == roleS && data.userid == $scope.localUserid)
                        vm.studentInfo.isBanChat = false;
                }
            }
        }
        else if(data.cmd == "chat:privatetalk"){       //私信
            if (data.touserid == $scope.localUserid) {
                if($scope.localRole == roleT){
                    vm.teacherInfo.privateMessage.unshift(data);
                }else{
                    vm.studentInfo.privateMessage.unshift(data);
                }
            }
        }


    };
    //ChatManager待实现的方法区---------------------------------------------------------------end
    //私有方法区---------------------------------------------------------------start
    var _chatViewShow = function(){             //显示聊天窗口
      vm.chat.showChatView = true;
    };
    var _chatViewHide = function(){             //隐藏聊天窗口
        vm.chat.showChatView = false;
    };
    var _controlChatOn = function(){            //讨论区发言开启
        vm.chat.controlChatStatus = true;
    };
    var _controlChatOff = function(){           //讨论区发言关闭
        vm.chat.controlChatStatus = false;
    };
    //私有方法区---------------------------------------------------------------end

    //聊天-----------------------------------------------------------------------------------end

    //白板--------------------------------------------------------------------------------白板---start
    vm.whiteboard.tools.colorOnOrOff = function(){          //调色板开启或关闭
        _lineHide();
        _fontHide();
        if(vm.whiteboard.tools.color){
            _colorHide();
            _selectTool('pen');
        }else{
            _colorShow();
            _selectTool('color');
        }
    };
    vm.whiteboard.tools.lineOnOrOff = function(){           //线条板开启或关闭
        if(vm.whiteboard.tools.line) {
            _lineHide();
            _selectTool('pen');
        }else {
            _lineShow();
            _selectTool('line');
            _colorHide();
        }
    };
    vm.whiteboard.tools.isChooseColor = function(){         //是否选择了调色板
        return vm.whiteboard.tools.currentTool === "color";
    };
    vm.whiteboard.tools.isChooseLine = function(){          //是否选择了线条
        return vm.whiteboard.tools.currentTool === "line";
    };
    vm.whiteboard.tools.isChoosePen = function(){           //是否选择了画笔
        return vm.whiteboard.tools.currentTool === "pen";
    };
    vm.whiteboard.tools.isChooseStraightline = function(){  //是否选择了直线
        return vm.whiteboard.tools.currentTool === "straightline";
    };
    vm.whiteboard.tools.isChooseCircle = function(){        //是否选择了圆
        return vm.whiteboard.tools.currentTool === "circle";
    };
    vm.whiteboard.tools.isChooseParty = function(){         //是否选择了方
        return vm.whiteboard.tools.currentTool === "party";
    };
    vm.whiteboard.tools.isChooseFont = function(){          //是否选择了文本输入
        return vm.whiteboard.tools.currentTool === "font";
    };
    vm.whiteboard.tools.closeFont = function(){             //关闭文本输入
        _fontHide();
        _selectTool('pen');
        whiteBoardManager.setToolType(0);
    };
    vm.whiteboard.tools.isChooseEraser = function(){        //是否选择了橡皮擦
        return vm.whiteboard.tools.currentTool === "eraser";
    };
    vm.whiteboard.tools.isShowPage = function(){            //是否显示白板分页
        return $scope.localRole == roleT;
    };
    vm.whiteboard.tools.isShowPreviousPage = function(){        //是否显示上一页
        return vm.whiteboard.tools.currentPage > 1;
    };
    vm.whiteboard.tools.isShowNextPage = function(){            //是否显示下一页
        return vm.whiteboard.tools.currentPage != vm.whiteboard.tools.totalPage && vm.whiteboard.tools.totalPage > 1;
    };
    vm.whiteboard.tools.isShowPageNumber = function(){          //是否显示分页的页数
        return vm.whiteboard.tools.totalPage > 0;
    };
    //私有方法区---------------------------------------------------------------start
    var _selectTool = function(toolName){               //设置当前选择的工具
        vm.whiteboard.tools.currentTool = toolName;
    };
    var _colorShow = function(){            //调色板显示
        vm.whiteboard.tools.color = true;
    };
    var _colorHide = function(){            //调色板隐藏
        vm.whiteboard.tools.color = false;
    };
    var _lineShow = function(){             //线条板显示
        vm.whiteboard.tools.line = true;
    };
    var _lineHide = function(){             //线条板隐藏
        vm.whiteboard.tools.line = false;
    };
    var _fontShow = function(){             //文本输入显示
        vm.whiteboard.tools.font = true;
    };
    var _fontHide = function(){             //文本输入隐藏
        vm.whiteboard.tools.font = false;
    };
    var _whiteboardOn = function(){         //开启白板
        vm.whiteboard.isOpenWhiteboard = true;
    };
    var _whiteboardOff = function(){        //关闭白板
        vm.whiteboard.isOpenWhiteboard = false;
    };
    var _whiteboardToolsOn = function(){        //开启工具条
        vm.whiteboard.isOpenTools = true;
    };
    var _whiteboardToolsOff = function(){       //关闭工具条
        vm.whiteboard.isOpenTools = false;
    };
    var _whiteboardShareOn = function(){        //开启共享白板
        vm.whiteboard.isOpenShareWhiteboard = true;
    };
    var _whiteboardShareOff = function(){       //关闭共享白板
        vm.whiteboard.isOpenShareWhiteboard = false;
    };
    //私有方法区---------------------------------------------------------------end
    //WhiteBoardManager待实现方法区-------------------------------------------start
    whiteBoardManager.setLineValue = function (value) {         //设置当前线条的大小
        vm.whiteboard.tools.lineValue = parseInt(value);
    };
    whiteBoardManager.getLineValue = function(){            //获取当前线条的大小
        return vm.whiteboard.tools.lineValue;
    };
    whiteBoardManager.lineOff = function () {       //关闭线条粗线
        _lineHide();
        _selectTool('pen');
    };
    whiteBoardManager.selectTool = function(toolName){      //记录选择的工具
        _selectTool(toolName);
    };
    whiteBoardManager.initWhiteboardPage = function(currentPage,totalPage){             //设置白板页数
        vm.whiteboard.tools.currentPage = currentPage;
        vm.whiteboard.tools.totalPage = totalPage;
    };
    whiteBoardManager.fontON_OFF = function(){          //文本输入开关
        _lineHide();
        _colorHide();
        if(vm.whiteboard.tools.font){
            _fontHide();
            _selectTool('pen');
        }else{
            _fontShow();
        }
    };
    whiteBoardManager.colorOff = function(){            //调色板关闭
        _colorHide();
    };
    whiteBoardManager.fontOff = function(){         //文本输入关闭
        _fontHide();
    };
    whiteBoardManager.fontIsOn = function(){        //是否开启文本输入
        return vm.whiteboard.tools.font;
    };
    whiteBoardManager.whiteboardToolsIsOn = function(){     //判断白板工具条是否开启
        return vm.whiteboard.isOpenTools;
    };
    whiteBoardManager.whiteboardOn = function(){            //开启白板
        _whiteboardOn();
    };
    whiteBoardManager.whiteboardOff = function(){           //关闭白板
        _whiteboardOff();
    };
    whiteBoardManager.whiteboardToolsOn = function(){       //工具条开启
        _whiteboardToolsOn();
    };
    whiteBoardManager.whiteboardToolsOff = function(){      //工具条关闭
        _whiteboardToolsOff();
    };
    whiteBoardManager.setTeaWhiteboardStatus = function(status){        //设置老师是否开启白板状态
        vm.classroomInfo.teaWhiteboardStatus = status;
    };
    whiteBoardManager.getTeaWhiteboardStatus = function(){              //获取老师是否开启白板状态
        return vm.classroomInfo.teaWhiteboardStatus;
    };
    whiteBoardManager.setShareWhiteboard = function(status){       //设置共享白板状态
        vm.whiteboard.isOpenShareWhiteboard = status;
    };
    whiteBoardManager.whiteboardIsOn = function(){              //是否开启白板
        return vm.whiteboard.isOpenWhiteboard;
    };
    whiteBoardManager.updateClassroomMode = function(value){    //修改课程模式
        vm.classroomInfo.classroomMode = value;
    };
    whiteBoardManager.coursewareTransformation = function(data){     //课件转换进度
        var documentObj = new Object();
        documentObj.documentindex = data.documentindex;
        documentObj.total = data.total;
        documentObj.errorcount = data.errorcount;
        $scope.$emit('courseware',documentObj);
    };
    whiteBoardManager.whiteboardShareOn = function(){           //开启白板共享
        _whiteboardShareOn();
    };
    whiteBoardManager.whiteboardShareOff = function(){          //关闭白板共享
        _whiteboardShareOff();
    };
    whiteBoardManager.getSharePCVideoStatus = function(){       //获取共享屏幕状态
        return vm.classroomInfo.isShareVideo;
    };
    whiteBoardManager.setMemberStopwhiteboard = function(status,userid){        //设置列表对应用户的白板状态
        var index = _findMemberByUserId(userid,vm.classroomInfo.data.members);
        if(index != null)
            vm.classroomInfo.data.members[index].stopwhiteboard = status;
    };
    whiteBoardManager.getWhiteBoardIsShareStatus = function(){          //返回是否共享白板状态
        return vm.whiteboard.isOpenShareWhiteboard;
    };
    whiteBoardManager.showMessageWindow = function(msg){                //弹出提示框
        return showMessageWindow(msg);
    };
    whiteBoardManager.operationMessageWindow = function(msg){           //操作提示框,带回调
        return operationMessageWindow(msg);
    };
    //WhiteBoardManager待实现方法区--------------------------------------------end
    //白板-----------------------------------------------------------------------------------end
    //视频----------------------------------------------------------------------------------start

    //LiveManager待实现方法区--------------------------------------------------start
    liveManager.applyData = function(){
        $scope.$apply();
    };
    liveManager.getClassroomType = function(){                  //返回课程类型
        return vm.classroomInfo.classroomType;
    };
    liveManager.setSharePCVideoStatus = function(status){       //设置共享屏幕状态
        vm.classroomInfo.isShareVideo = status;
    };
    liveManager.setCurrentVideo = function(value){              //记录老师当前的是第几个视频
        vm.classroomInfo.teacherCurrentVideo = value;
    };
    liveManager.getHasmeeting = function(){                     //返回会议是否创建
        return vm.classroomInfo.hasmeeting;
    };
    liveManager.getTeacherControlAllVideoStatus = function(){    //返回老师控制所有学生视频状态
        return vm.teacherInfo.controlVideo;
    };
    liveManager.getTeacherControlAllAudioStatus = function(){    //返回老师控制所有学生音频状态
        return vm.teacherInfo.controlAudio;
    };
    liveManager.setCurrentVideo = function(value){              //记录老师当前的主画面视频
        vm.classroomInfo.teacherCurrentVideo = value;
    };
    liveManager.setTeacherVideoOpenStatus = function(value,type){//记录老师摄像头开启状态
        if(type == 1){
            vm.teacherInfo.isOpenFirstVideo = value;
        }else if(type == 2){
            vm.teacherInfo.isOpenSecondVideo = value;
        }
    };
    liveManager.setVideoSource = function(number){              //设置视频设备状态
        if($scope.localRole == roleT)
            vm.teacherInfo.setVideoStatus(number);
        else
            vm.studentInfo.setVideoStatus(number);
    };
    liveManager.setAudioSource = function(number){              //设置音频设备状态
        if($scope.localRole == roleT)
            vm.teacherInfo.setAudioStatus(number);
        else
            vm.studentInfo.setAudioStatus(number);
    };
    liveManager.getAudioStatus = function(){                    //返回音频开启状态
        if($scope.localRole == roleT)
            return vm.teacherInfo.isOpenAudio;
        else if($scope.localRole == roleS)
            return vm.studentInfo.isOpenAudio;
    };
    liveManager.setAudioStatus = function(status){         //记录老师或学生音频状态
        if($scope.localRole == roleT)
            vm.teacherInfo.isOpenAudio = status;
        else if($scope.localRole == roleS)
            vm.studentInfo.isOpenAudio = status;
    };
    liveManager.setListStopvideo = function(userid,status){             //设置列表人员的视频图标状态
        var index = _findMemberByUserId(userid,vm.classroomInfo.data.members);
        if(index != null) {
            vm.classroomInfo.data.members[index].stopvideo = status;
            if($scope.localRole == roleT && vm.classroomInfo.data.members[index].roleid == 2){
                if(status == 2){
                    vm.teacherInfo.controlVideo = 0;
                }else if(status == 0){
                    vm.teacherInfo.controlVideo = 2;
                }
            }
        }
    };
    liveManager.setListStopspeak = function(userid,status){             //设置列表人员的音频图标状态
        var index = _findMemberByUserId(userid,vm.classroomInfo.data.members);
        if(index != null){
            vm.classroomInfo.data.members[index].stopspeak = status;
            if($scope.localRole == roleS && vm.classroomInfo.data.members[index].roleid == 1){
                if(status == 2)
                    vm.studentInfo.teacherIsOpenAudio = true;
                else
                    vm.studentInfo.teacherIsOpenAudio = false;
            }
            else if($scope.localRole == roleT && vm.classroomInfo.data.members[index].roleid == 2){
                if(status == 2){
                    vm.teacherInfo.controlAudio = 0;
                }else if(status == 0){
                    vm.teacherInfo.controlAudio = 2;
                }
            }
        }
    };
    liveManager.getCurrentVideo = function(){                   //返回老师当前是第几个视频
        return vm.classroomInfo.teacherCurrentVideo;
    };
    liveManager.getSharePCVideoStatus = function(){             //获取共享屏幕状态
        return vm.classroomInfo.isShareVideo;
    };
    liveManager.setStudentHandup = function(userid,status){     //设置列表的学生举手闪烁状态
        var index = _findMemberByUserId(userid,vm.classroomInfo.data.members);
        if(index != null){
            vm.classroomInfo.data.members[index].handspeak = status;
            if($scope.localRole == roleT){
                if(status == 1)
                    vm.teacherInfo.handupList.push(vm.classroomInfo.data.members[index]);
            }
        }
    };
    liveManager.setVideoIsBan = function(status){               //设置学生是否禁止视频
        vm.studentInfo.isBanVideo = status;
    };
    liveManager.getVideoIsBan = function(){                     //返回学生是否禁止视频
        return vm.studentInfo.isBanVideo;
    };
    liveManager.setAudioIsBan = function(status){               //设置学生是否禁止音频
        vm.studentInfo.isBanAudio = status;
    };
    liveManager.getAudioIsBan = function(){                     //返回学生是否禁止音频
        return vm.studentInfo.isBanAudio;
    };
    liveManager.setStudentVideoOpenStatus = function(status){    //设置学生视频开启状态
        vm.studentInfo.isOpenVideo = status;
    };
    liveManager.getStudentVideoOpenStatus = function(){         //返回学生视频开启状态
        return vm.studentInfo.isOpenVideo;
    };
    liveManager.setIsSubAudioStatus = function(status){         //设置是否订阅过音频的状态
        if(role == roleT)
            vm.teacherInfo.isSubAudio = status;
        else
            vm.studentInfo.isSubAudio = status;
    };
    liveManager.getIsSubAudioStatus = function(){               //返回是否订阅过音频的状态
        if(role == roleT)
            return vm.teacherInfo.isSubAudio;
        else
            return vm.studentInfo.isSubAudio;
    };
    liveManager.setTeacherIsOpenAudioStatus = function(status){       //设置老师是否开启音频状态
        vm.studentInfo.teacherIsOpenAudio = status;
    };
    liveManager.getTeacherIsOpenAudioStatus = function(){             //返回老师是否开启音频状态
        return vm.studentInfo.teacherIsOpenAudio;
    };
    liveManager.updateMembers = function(userid){                    //更新members,将离开的用户从members中清除
        var index = _findMemberByUserId(userid,vm.classroomInfo.data.members);
        if(index != null)
            vm.classroomInfo.data.members.splice(index,1);
    };
    liveManager.leaveChange = function(value){                      //主视频学生离开后改变主视频显示
        vm.classroomInfo.teacherCurrentVideo = value;
        liveManager.changeVideoShow(value);
    };
    liveManager.audioBanOn = function(){                    //音频禁止状态
        vm.studentInfo.isBanAudio = true;
    };
    liveManager.audioBanOff = function(){                   //音频开启状态
        vm.studentInfo.isBanAudio = false;
    };
    liveManager.getTeaWhiteboardStatus = function(){        //获取老师是否开启白板状态
        return vm.classroomInfo.teaWhiteboardStatus;
    };
    liveManager.whiteboardOn = function(){                  //开启白板
        _whiteboardOn();
    };
    liveManager.whiteboardOff = function(){                 //关闭白板
        _whiteboardOff();
    };
    liveManager.setCoursewareShow = function(data){         //显示课件转换进度
        $scope.$emit('setcoursewareshow',data);
    };
    liveManager.setDelayApplyWindow = function(data){       //设置申请延时窗口数据,并弹出该窗口
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        var modalInstance = $modal.open({
            templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.DELAY,
            backdrop:'static',
            controller: 'delayWindowController',
            resolve: {
                data: function() {
                    return data;
                }
            }
        });
        modalInstance.result.then(function(result){
            var command = {
                cmd:"controlpanel:setdelay",
                roomid:$scope.localRoomid,
                userid:$scope.localUserid,
                minuts:result,
                userName:$scope.localRealName,
                classroomName:vm.classroomInfo.classroomName
            };
            classRoomControler.sendMessage(command);
        });
    };
    liveManager.setDelayRemindCss = function(status){           //设置课堂时间提示闪烁状态
        $scope.$emit('nomoretime',status);
    };
    liveManager.showMessageWindow = function(msg){                 //弹出提示框
        return showMessageWindow(msg);
    };
    liveManager.openErrorWindow = function(msg){                //错误窗口
        return openErrorWindow(msg);
    };
    liveManager.setShareWhiteboardStatus = function(status){        //设置白板共享状态
        vm.whiteboard.isOpenShareWhiteboard = status;
    };
    liveManager.setDelayShowStatus = function(value){           //设置申请延时的显示状态
        $scope.$emit('delayShow',value);
    };
    liveManager.quitClassRoomJump = function(){                 //退出课室跳转页面
        var quitUrl = '/classroom/room/detail/user'+'?roomId='+$scope.localRoomid+'&userId='+$scope.localUserid;
        liveFactory.get(quitUrl).then(function(data){
            if(data!=null&&data.orderItems!=null){
                window.location.href = window.location.protocol + "//" + window.location.hostname + '/praise/operate?orderItemId=' + data.orderItems.id;
            }else{
                window.location.href = window.location.protocol + "//" + window.location.hostname + '/order/student/1';
            }
        });
    };
    //LiveManager待实现方法区--------------------------------------------------end
    //视频------------------------------------------------------------------------------------end
    //老师左侧控制台-----------------------------------------------------------------------------start
    //私有方法区------------------------------------------------------------start
    var _setAllMemberStopwhiteboard = function(status){               //设置列表成员的白板图标状态:0为不可用,1为可用
        $.each(vm.classroomInfo.data.members,function(index,member){
            vm.classroomInfo.data.members[index].stopwhiteboard = status;
        });
    };
    var _userIsCanChangeVideo = function(value){                  //判断能否进行切换
        var vsrc = null;
        if(value == 't_1'){              //判断要切换的是否为老师的第一个视频
            vsrc = $('#divVideoLocal_a video').attr('src');
        }else if(value == 't_2'){        //判断要切换的是否为老师的第一个视频
            vsrc = $('#divVideoLocal_b video').attr('src');
        }else{
            var index = _findMemberByUserId(value,vm.classroomInfo.data.members);
            if(index != null){
                var uid = vm.classroomInfo.data.members[index].userid;
                vsrc = $('#' + uid + ' video').attr('src');
            }
        }
        if(typeof vsrc === 'undefined' || vsrc == null){
            return false;
        }
        return true;
    };
    var _cleanHandupList = function(){                                  //清除举手列表-------待完成
        $.each(vm.classroomInfo.data.members,function(index,member){
            if(member.handspeak == 1) {
                var command = {
                    cmd: "userctrl:handspeak",
                    roomid: $scope.localRoomid,
                    userid: member.userid,
                    status: 0,
                    userName: member.username,
                    classroomName: vm.classroomInfo.classroomName
                };
                classRoomControler.sendMessage(command);
            }
        });
        $log.debug("-------------------->>>>>handupList",vm.teacherInfo.handupList);
    };
    var _HANDUPTIME_teacher_count = function(){                         //举手计时器
        if(vm.classroomInfo.HANDUPTIME == 0){       //如果时间已到
            vm.teacherInfo.handupListViewShow = true;
            vm.teacherInfo.allowHandup = false;
            _cleanHandupList();
            $interval.cancel(tpromise);
            return;
        }
        vm.classroomInfo.HANDUPTIME--;
    };
    //私有方法区------------------------------------------------------------end
    vm.teacherInfo.controlChat = function(){                    //老师控制讨论区发言----------待完成
        if(vm.chat.controlChatStatus){
            _controlChatOff();
        }else{
            _controlChatOn();
        }
        //发送命令通知服务器,记录是否开启允许聊天状态
    };
    vm.teacherInfo.isOpenControlChat = function(){              //是否打开讨论区发言
        return vm.chat.controlChatStatus;
    };
    vm.teacherInfo.openOrCloseWhiteboard = function(){         //老师打开或关闭白板
        whiteBoardManager.openOrCloseWhiteboard();
    };
    vm.teacherInfo.openOrCloseDocument = function(){            //打开或关闭文档
        var msg = VC.ROUTER.LIVEBIG.LIVE_DOC_AND_APP_TIPS;
        liveManager.showMessageWindow(msg);
    };
    vm.teacherInfo.openOrCloseApp = function(){                 //打开或关闭程序
        var msg = VC.ROUTER.LIVEBIG.LIVE_DOC_AND_APP_TIPS;
        liveManager.showMessageWindow(msg);
    };
    vm.teacherInfo.isOpenWhiteboard = function(){              //老师是否打开白板
        return vm.whiteboard.isOpenWhiteboard;
    };
    vm.teacherInfo.openShareWhiteboard = function(){            //老师打开白板共享
        if(vm.whiteboard.isOpenShareWhiteboard){    //判断是否打开共享白板
            _whiteboardShareOff();
            _setAllMemberStopwhiteboard(0);
            var command = {
                cmd:"controlpanel:sharewhiteboard",
                roomid:$scope.localRoomid,
                isTeacher:true,
                status:0,
                userid:$scope.localUserid,
                userName:$scope.localRealName,
                classroomName:vm.classroomInfo.classroomName
            };
            classRoomControler.sendMessage(command);
        }else{
            if(vm.whiteboard.isOpenWhiteboard){             //判断是否已打开白板
                _whiteboardShareOn();
                _setAllMemberStopwhiteboard(1);
                var command = {
                    cmd:"controlpanel:sharewhiteboard",
                    roomid:$scope.localRoomid,
                    isTeacher:true,
                    status:1,
                    userid:$scope.localUserid,
                    userName:$scope.localRealName,
                    classroomName:vm.classroomInfo.classroomName
                };
                classRoomControler.sendMessage(command);
            }else{
                var msg = VC.ROUTER.LIVEBIG.SHAREWHITEBOARD_TIPS;
                liveManager.showMessageWindow(msg);
            }
        }
    };
    vm.teacherInfo.isOpenShareWhiteboard = function(){          //老师是否打开白板共享
        return vm.whiteboard.isOpenShareWhiteboard;
    };
    vm.teacherInfo.setChat = function(obj){                     //左侧列表,老师控制学生讨论区发言
        if($scope.localRole === roleS)
            return;
        var toIndex = _findMemberByUserId(obj.userid,vm.classroomInfo.data.members);
        if(toIndex != null){
            if(obj.stopchat == 0){
                vm.classroomInfo.data.members[toIndex].stopchat = 1;
            }else{
                vm.classroomInfo.data.members[toIndex].stopchat = 0;
            }
            var messagejson = new Object();
            messagejson.cmd = "userctrl:stopchat";
            messagejson.roomid = $scope.localRoomid;
            messagejson.userid = obj.userid;
            messagejson.status = vm.classroomInfo.data.members[toIndex].stopchat;
            messagejson.userName = obj.username;
            messagejson.classroomName = vm.classroomInfo.classroomName;
            classRoomControler.sendMessage(messagejson);
        }
    };
    vm.teacherInfo.openMessageToOther = function(obj){             //左侧列表,老师打开对其他人的私信窗口
        vm.teacherInfo.privateMessage = _updateLocalMessageList(vm.teacherInfo.privateMessage,obj.userid);
        sendMessagePr(obj.userid,obj.username);
        var messagejson = new Object();
        messagejson.cmd = "userctrl:privatechat";
        messagejson.roomid = $scope.localRoomid;
        messagejson.userid = obj.userid;
        messagejson.touserid = $scope.localUserid;
        messagejson.status = 0;
        messagejson.userName = obj.username;
        messagejson.classroomName = vm.classroomInfo.classroomName;
        classRoomControler.sendMessage(messagejson);
    };
    vm.teacherInfo.privateMessageCountStatus = function(){          //判断老师私信列表数量

        return vm.teacherInfo.privateMessage.length > 0;
    };
    vm.teacherInfo.openMessage = function(){                        //老师打开私信列表(存储别人发过来的信息)
        if(!vm.teacherInfo.privateMessageCountStatus()){
            return;
        }
        sendMessagePr(vm.teacherInfo.privateMessage[0].userid,vm.teacherInfo.privateMessage[0].username);   //打开窗口
        vm.teacherInfo.privateMessage = _updateLocalMessageList(vm.teacherInfo.privateMessage,vm.teacherInfo.privateMessage[0].userid);
    };
    vm.teacherInfo.firstVideoOpenStatus = function(){               //返回老师第一个视频的开启状态
        return vm.teacherInfo.isOpenFirstVideo;
    };
    vm.teacherInfo.secondVideoOpenStatus = function(){              //返回老师第二个视频的开启状态
        return vm.teacherInfo.isOpenSecondVideo;
    };
    vm.teacherInfo.setVideoStatus = function(number){                     //获取视频资源数量
        if(number > 0 && number < 2) {
            vm.teacherInfo.connectFirstVideo = true;
        }else if(number >=2) {
            vm.teacherInfo.connectFirstVideo = true;
            vm.teacherInfo.connectSecondVideo = true;
        }
    };
    vm.teacherInfo.setAudioStatus = function(number){                   //获取音频资源数量
        if(number >= 1){
            vm.teacherInfo.connectAudio = true;
        }
    };
    var firstVideoOnAndOff = function(){
        liveManager._SingledoubleSip(1,vm.teacherInfo.isOpenFirstVideo);
        /*if(vm.teacherInfo.isOpenFirstVideo)
            vm.teacherInfo.isOpenFirstVideo = false;
        else
            vm.teacherInfo.isOpenFirstVideo = true;*/
    };
    vm.teacherInfo.firstVideoOnAndOff = function(){                 //老师开关第一个视频
        if(!vm.teacherInfo.connectFirstVideo){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            liveManager.showMessageWindow(msg);return;
        }
        if(clickVideoPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        clickVideoPromise = true;
        var stopClickVideoPromise = $timeout(function(){
            clickVideoPromise = false;
            $timeout.cancel(stopClickVideoPromise);
        },clickVideoPromiseTime);
        firstVideoOnAndOff();
    };
    var secondVideoOnAndOff = function(){
        liveManager._SingledoubleSip(2,vm.teacherInfo.isOpenSecondVideo);
        /*if(vm.teacherInfo.isOpenSecondVideo)
            vm.teacherInfo.isOpenSecondVideo = false;
        else
            vm.teacherInfo.isOpenSecondVideo = true;*/
    };
    vm.teacherInfo.secondVideoOnAndOff = function(){                //老师开关第二个视频
        if(!vm.teacherInfo.connectSecondVideo){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            liveManager.showMessageWindow(msg);return;
        }
        if(clickVideoPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        clickVideoPromise = true;
        var stopClickVideoPromise = $timeout(function(){
            clickVideoPromise = false;
            $timeout.cancel(stopClickVideoPromise);
        },clickVideoPromiseTime);
        secondVideoOnAndOff();
    };
    vm.teacherInfo.getAudioStatus = function(){                        //返回老师音频状态
        return vm.teacherInfo.isOpenAudio;
    };
    vm.teacherInfo.audioOnAndOff = function(){                      //老师开关音频
        if(clickAudioPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        clickAudioPromise = true;
        var stopClickAudioPromise = $timeout(function(){
            clickAudioPromise = false;
            $timeout.cancel(stopClickAudioPromise);
        },clickAudioPromiseTime);
        if(vm.teacherInfo.isOpenAudio){
            liveManager.closePublishAudio();     //off
        }else{
            liveManager.openPublishAudio();      //on
        }
    };
    vm.teacherInfo.changeVideo = function(value){                        //老师切换视频
        if(!_userIsCanChangeVideo(value)){
            var msg = VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
            liveManager.showMessageWindow(msg);return;
        }
        _whiteboardOff();               //关闭白板
        _whiteboardToolsOff();          //关闭工具条
        _whiteboardShareOff();          //关闭白板共享
        whiteBoardManager._sendPixelMessage("done", 8, "", "8#1,1", false, 0);
        vm.classroomInfo.teacherCurrentVideo = value;
        liveManager.changeVideoShow(value);
    };
    vm.teacherInfo.controlAllVideoIsOpen = function(){
        return vm.teacherInfo.controlVideo == 0;
    };
    vm.teacherInfo.controlAllVideo = function(){                //老师控制所有学生的视频开关
        if(vm.teacherInfo.controlVideo == 2){
            var msg = VC.ROUTER.TEMPLATE_TIPS.LIVE_ONE_CONTROLVIDEO_MSG;
            liveManager.showMessageWindow(msg);return;
        }
        if(controlAllVideoPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        controlAllVideoPromise = true;
        var stopControlAllVideoPromise = $timeout(function(){
            controlAllVideoPromise = false;
            $timeout.cancel(stopControlAllVideoPromise);
        },controlAllVideoPromiseTime);
        if(vm.teacherInfo.controlAllVideoIsOpen()){
            vm.teacherInfo.controlVideo = 1;
            liveManager.controlAllVideo(1);        //关
            //liveManager.subscribeSipHangUpVideo(vm.teacherInfo.studentId());
        }else{
            vm.teacherInfo.controlVideo = 0;
            liveManager.controlAllVideo(0);        //开
            //liveManager.subscribeSipVideo(vm.teacherInfo.studentId());
        }
    };
    vm.teacherInfo.controlAllAudioIsOpen = function(){
        return vm.teacherInfo.controlAudio == 0;
    };
    vm.teacherInfo.controlAllAudio = function(){                //老师控制所有学生的音频开关
        if(vm.teacherInfo.controlAudio == 2){
            var msg = VC.ROUTER.TEMPLATE_TIPS.LIVE_ONE_CONTROLAUDIO_MSG;
            liveManager.showMessageWindow(msg);return;
        }
        if(controlAllAudioPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        controlAllAudioPromise = true;
        var stopControlAllAudioPromise = $timeout(function(){
            controlAllAudioPromise = false;
            $timeout.cancel(stopControlAllAudioPromise);
        },controlAllAudioPromiseTime);
        if(vm.teacherInfo.controlAllAudioIsOpen()){
            liveManager.controlAllAudio(1);//关
            vm.teacherInfo.controlAudio = 1;
        }else{
            liveManager.controlAllAudio(0);//开
            vm.teacherInfo.controlAudio = 0;
        }
    };
    vm.teacherInfo.controlSingleStudentVideoOpenOrBan = function(stuObj){       //老师控制单个学生的视频开关,0:为发布,2:禁止,1:开启
        if(stuObj.stopvideo == 0){
            return;
        }
        if(stuObj.stopvideo == 2){
            liveManager.banPublishVideo(stuObj);             //禁止
        }else if(stuObj.stopvideo == 1){
            liveManager.noBanPublishVideo(stuObj);           //开启
            var index = _findMemberByUserId(stuObj.userid,vm.classroomInfo.data.members);
            if(index != null)
                vm.classroomInfo.data.members[index].stopvideo = 0;
        }
    };
    vm.teacherInfo.controlSingleStudentAudioOpenOrBan = function(stuObj){             //老师控制单个学生的音频开关,0:未发布,1:禁止,2:开启
        /*if(stuObj.stopspeak == 0){
            return;
        }*/
        if(stuObj.stopspeak == 2){
            liveManager.banPublishAudio(stuObj);                //禁止
        }else if(stuObj.stopspeak == 1 || stuObj.stopspeak == 0){
            liveManager.noBanPublishAudio(stuObj);                 //开启
            var index = _findMemberByUserId(stuObj.userid,vm.classroomInfo.data.members);
            if(index != null)
                vm.classroomInfo.data.members[index].stopspeak = 0;
        }
    };
    vm.teacherInfo.changeClassroomMode = function(){                        //老师切换课程模式(0:授课模式,1:讨论模式)
        if(vm.classroomInfo.classroomMode == 0){            //当前为授课模式
            vm.classroomInfo.classroomMode = 1;
        }else{                                              //当前为讨论模式
            vm.classroomInfo.classroomMode = 0;
        }
        var command = {
            roomid:$scope.localRoomid,
            cmd:"controlpanel:inclass",
            isteacher:true,
            sharewhiteboard:0,
            status:vm.classroomInfo.classroomMode,             // 0 授课   1 讨论
            userid:$scope.localUserid,
            userName:$scope.localRealName,
            classroomName:vm.classroomInfo.classroomName
        };
        classRoomControler.sendMessage(command);
        vm.teacherInfo.controlAllAudio();
    };
    vm.teacherInfo.sharePCVideo = function(){                   //老师共享屏幕开关
        if(vm.classroomInfo.isShareVideo){
            liveManager.closeSharePCVideo();        //关
        }else{
            liveManager.openSharePCVideo();         //开
        }
    };
    vm.teacherInfo.allowHandupOnOrOff = function(){             //老师允许学生举手开关--------一对一没有此功能
        if(vm.teacherInfo.allowHandup){
            return;
        }else{
            //开
            vm.teacherInfo.allowHandup = true;
            vm.teacherInfo.handupList = [];
            vm.classroomInfo.HANDUPTIME = 60;
            if(vm.teacherInfo.handupSelectStudent.length > 0) {
                liveManager.banPublishAudio(vm.teacherInfo.handupSelectStudent[0]);
            }
            //开始60秒时间计算,在该段时间内,老师不能再点
            tpromise = $interval(function(){
                _HANDUPTIME_teacher_count();
            },1000);
            //发送命令通知服务器,记录状态,并通知学生
            var command = {
                cmd:"controlpanel:allow_handup",
                roomid:$scope.localRoomid,
                status:vm.teacherInfo.allowHandup,
                time:vm.classroomInfo.HANDUPTIME,
                userid:$scope.localUserid,
                userName:$scope.localRealName,
                classroomName:vm.classroomInfo.classroomName
            };
            classRoomControler.sendMessage(command);
        }
    };
    vm.teacherInfo.handupListStatus = function(){               //是否有学生举手
        return vm.teacherInfo.handupList.length > 0;
    };
    vm.teacherInfo.openHandupList = function(){                 //打开学生举手列表
        if(vm.teacherInfo.handupListViewShow){
            //关
            vm.teacherInfo.handupListViewShow = false;
        }else{
            //开
            vm.teacherInfo.handupListViewShow = true;
        }
    };
    vm.teacherInfo.closeHandupList = function(){                //关闭学生举手列表
        vm.teacherInfo.handupListViewShow = false;
    };
    vm.teacherInfo.endHandupList = function(){                  //结束本次发问--------待完成
        //让选择发言的学生挂掉音频,关闭列表窗口,清空列表,清空选中学生
        if(vm.teacherInfo.handupSelectStudent.length > 0) {
            liveManager.banPublishAudio(vm.teacherInfo.handupSelectStudent[0]);
        }
        vm.teacherInfo.allowHandup = false;
        vm.teacherInfo.handupList = [];
        vm.teacherInfo.handupSelectStudent = [];
        vm.classroomInfo.HANDUPTIME = 60;
    };
    vm.teacherInfo.selectHandupStudent = function(stuobj){      //选择学生举手列表的学生-----待完成
        if(vm.teacherInfo.handupSelectStudent.length > 0){
            var msg = VC.ROUTER.LIVEBIG.SELECT_ONE;
            liveManager.showMessageWindow(msg);
            return;
        }
        liveManager.noBanPublishAudio(stuobj);
        var index = _findMemberByUserId(stuobj.userid,vm.classroomInfo.data.members);
        if(index != null)
            vm.classroomInfo.data.members[index].stopspeak = 0;
        vm.teacherInfo.handupSelectStudent.push(stuobj);
    };
    vm.teacherInfo.isHaveStudentJoin = function(){              //是否有学生加入---1:1
        var isHave = false;
        if(vm.classroomInfo.data != null) {
            $.each(vm.classroomInfo.data.members, function (index, member) {
                if (member.roleid == 2) {
                    isHave = true;
                }
            });
        }
        return isHave;
    };
    vm.teacherInfo.studentUsername = function(){            //返回学生名字
        var name = null;
        if(vm.classroomInfo.data != null) {
            $.each(vm.classroomInfo.data.members, function (index, member) {
                if (member.roleid == 2) {
                    name = member.username;
                }
            });
        }
        return name;
    };
    vm.teacherInfo.studentId = function(){              //返回学生id
        var userid = null;
        if(vm.classroomInfo.data != null) {
            $.each(vm.classroomInfo.data.members, function (index, member) {
                if (member.roleid == 2) {
                    userid = member.userid;
                    return false;
                }
            });
        }
        return userid;
    };
    vm.teacherInfo.studentVideoStatus = function(){         //学生视频状态
        var status = 0;
        if(vm.teacherInfo.studentId() == null)          //未链接
            status = 0;
        else if(!vm.teacherInfo.controlAllVideoIsOpen())    //已关闭
            status = 1;
        else
            status = -1;
        return status;
    };
    vm.teacherInfo.studentAvatar = function(){          //老师获取学生头像
        if(vm.teacherInfo.studentVideoStatus() == 0){
            return "";
        }else {
            var avatar = _findAvatarFromMemebersByUserid(vm.teacherInfo.studentId(),vm.classroomInfo.data.members);
            if(avatar === ""){
                return "";
            }else{
                return {
                    'background-image': 'url('+avatar+')',
                    'background-size': '100% 100%'
                }
            }
        }
    };
    vm.teacherInfo.uploadDocument = function(){//上传课件
    	var vcliveHost = $('#vcliveHost').val();
    	return vcliveHost + "/meeting/classroom/upload?roomId=" + $scope.localRoomid + "&key=3c246167fc5e36adf73849c8798d1111";
    };    
    liveManager.getCurrentResolution = function(){//获取当前视频分辨率类型
        return vm.classroomInfo.currentResolution;
    };
    vm.teacherInfo.commitVideoResolution = function(){//提交选择的视频分辨率
        vm.classroomInfo.currentResolution = tempResolutionTypeValue;
        if(vm.teacherInfo.isOpenFirstVideo){
            firstVideoOnAndOff();
            setTimeout(function(){
                firstVideoOnAndOff();
            },1500);
        }
        if(vm.teacherInfo.isOpenSecondVideo){
            secondVideoOnAndOff();
            setTimeout(function(){
                secondVideoOnAndOff();
            },2000);
        }
        vm.teacherInfo.openAndCloseResolutionView();
    };
    vm.teacherInfo.openAndCloseResolutionView = function(){//打开或关闭分辨率选择窗口
        vm.classroomInfo.showResolutionSelectView = !vm.classroomInfo.showResolutionSelectView;
    };
    vm.teacherInfo.getShowResolutionSelectViewStatus = function(){//分辨率切换窗口显示状态
        return vm.classroomInfo.showResolutionSelectView;
    };
    var tempResolutionTypeValue = 40;
    vm.teacherInfo.selectResolution = function(value){//选择视频分辨率类型
        tempResolutionTypeValue = value;
    };
    vm.teacherInfo.isCurrentResolutionByValue = function(value){
        return tempResolutionTypeValue == value;
    };
    vm.teacherInfo.getCurrentResolution = function(){//当前分辨率
        return vm.classroomInfo.currentResolution;
    };
    //老师左侧控制台-------------------------------------------------------------------------------end
    //学生左侧控制台-----------------------------------------------------------------------------start
    //私有方法区------------------------------------------------------------------start
    var _HANDUPTIME_student_count = function(){             //举手计时器
        if(vm.classroomInfo.HANDUPTIME == 0){
            vm.studentInfo.allowHandup = false;
            vm.studentInfo.isHandup = false;
            vm.classroomInfo.HANDUPTIME = 60;
            $interval.cancel(spromise);
            return;
        }
        $log.debug("----------------->>time",vm.classroomInfo.HANDUPTIME);
        vm.classroomInfo.HANDUPTIME--;
    };
    //私有方法区------------------------------------------------------------------end
    vm.studentInfo.openMessage = function(){                    //学生打开私信列表(存储别人发过来的信息)
        if(!vm.studentInfo.privateMessageCountStatus()){
            return;
        }
        sendMessagePr(vm.studentInfo.privateMessage[0].userid,vm.studentInfo.privateMessage[0].username);   //打开窗口
        vm.studentInfo.privateMessage = _updateLocalMessageList(vm.studentInfo.privateMessage,vm.studentInfo.privateMessage[0].userid);
    };
    vm.studentInfo.openMessageToTeacher = function(){           //学生打开对老师的私信窗口
        sendMessagePr(vm.teacherInfo.userid,vm.teacherInfo.username);
        var messagejson = new Object();
        messagejson.cmd = "userctrl:privatechat";
        messagejson.roomid = $scope.localRoomid;
        messagejson.userid = vm.teacherInfo.userid;
        messagejson.touserid = $scope.localUserid;
        messagejson.status = 0;
        messagejson.userName = $scope.localRealName;
        messagejson.classroomName = vm.classroomInfo.classroomName;
        classRoomControler.sendMessage(messagejson);
        vm.studentInfo.privateMessage = _updateLocalMessageList(vm.studentInfo.privateMessage,vm.teacherInfo.userid);
    };
    vm.studentInfo.openMessageToOther = function(stuObj){             //学生打开对其他学生的私信窗口
        vm.studentInfo.privateMessage = _updateLocalMessageList(vm.studentInfo.privateMessage,stuObj.userid);
        sendMessagePr(stuObj.userid,stuObj.username);
        var messagejson = new Object();
        messagejson.cmd = "userctrl:privatechat";
        messagejson.roomid = $scope.localRoomid;
        messagejson.userid = stuObj.userid;
        messagejson.touserid = $scope.localUserid;
        messagejson.status = 0;
        messagejson.userName = $scope.localRealName;
        messagejson.classroomName = vm.classroomInfo.classroomName;
        classRoomControler.sendMessage(messagejson);
    };
    vm.studentInfo.privateMessageCountStatus = function(){           //判断学生私信列表数量
        return vm.studentInfo.privateMessage.length > 0;
    };
    vm.studentInfo.setVideoStatus = function(number){                //设置学生视频设备的连接状态
        if(number > 0) {
            vm.studentInfo.connectVideo = true;
        }
    };
    vm.studentInfo.setAudioStatus = function(number){                //设置学生麦克风的连接状态
        if(number >= 1){
            vm.studentInfo.connectAudio = true;
        }
    };
    vm.studentInfo.videoOnAndOff = function(){                       //学生开关自己的视频
        if(!vm.studentInfo.connectVideo){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            liveManager.showMessageWindow(msg);return;
        }
        if(vm.studentInfo.isBanVideo){
            var msg = VC.ROUTER.LIVEBIG.VIDEO_HAVE_BAN;
            liveManager.showMessageWindow(msg);return;
        }
        if(clickVideoPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        clickVideoPromise = true;
        var stopClickVideoPromise = $timeout(function(){
            clickVideoPromise = false;
            $timeout.cancel(stopClickVideoPromise);
            $log.log("------------------>>>>>释放......");
        },clickVideoPromiseTime);
        if(vm.studentInfo.isOpenVideo){
            liveManager.closePublishVideo();            //关
        }else{
            liveManager.openPublishVideo();             //开
        }
    };
    vm.studentInfo.audioOnAndOff = function(){              //学生开关音频
        if(!vm.studentInfo.connectAudio){
            var msg = VC.ROUTER.LIVEBIG.MEDIA_TIPS;
            liveManager.showMessageWindow(msg);return;
        }
        if(vm.studentInfo.isBanAudio){
            var msg = VC.ROUTER.LIVEBIG.AUDIO_HAVE_BAN;
            liveManager.showMessageWindow(msg);return;
        }
        if(clickAudioPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            liveManager.showMessageWindow(msg);return;
        }
        clickAudioPromise = true;
        var stopClickAudioPromise = $timeout(function(){
            clickAudioPromise = false;
            $timeout.cancel(stopClickAudioPromise);
        },clickAudioPromiseTime);
        if(vm.studentInfo.isOpenAudio){
            liveManager.closePublishAudio();            //关
        }else{
            liveManager.openPublishAudio();             //开
        }
    };
    vm.studentInfo.teacherVideoShowSwitch = function(){     //学生界面老师视频显示切换
        if(liveManager._isHaveFirstVideo() && liveManager._isHavaSecondVideo()){
            if(vm.classroomInfo.teacherCurrentVideo == 't_1'){
                vm.studentInfo.viewTeacherVideoShow = 2;
            }else if(vm.classroomInfo.teacherCurrentVideo == 't_2'){
                vm.studentInfo.viewTeacherVideoShow = 1;
            }
        }else if(liveManager._isHaveFirstVideo()){
            vm.studentInfo.viewTeacherVideoShow = 1;
        }else if(liveManager._isHavaSecondVideo()){
            vm.studentInfo.viewTeacherVideoShow = 2;
        }
        return vm.studentInfo.viewTeacherVideoShow;
    };
    vm.studentInfo.handup = function(){                     //学生举手----------待完成
        if(vm.studentInfo.allowHandup){
            if(vm.studentInfo.isHandup){
                var msg = VC.ROUTER.LIVEBIG.NO_AUTH_NO_HANDUP;
                liveManager.showMessageWindow(msg);
                return;
            }
            vm.studentInfo.isHandup = true;
            //发送命令通知老师,该学生举手了
            liveManager.studentHandUp();
        }else{
            var msg = VC.ROUTER.LIVEBIG.NOW_NO_HANDUP;liveManager.showMessageWindow(msg);
        }
    };
    vm.studentInfo.audioStatusTitle = function(){       //学生麦克风状态提示
        var title = "";
        if(vm.studentInfo.isBanAudio)
            title = VC.ROUTER.LIVEBIG.LIVE_AUDIO_STATUS_TITLE;
        else if(!vm.studentInfo.connectAudio || !vm.studentInfo.isOpenAudio)
            title = VC.ROUTER.LIVEBIG.LIVE_NO_STATUS_TITLE;
        return title;
    };
    vm.studentInfo.videoStatusTitle = function(){       //学生视频状态提示
        var title = "";
        if(vm.studentInfo.isBanVideo)
            title = VC.ROUTER.LIVEBIG.LIVE_VIDEO_STATUS_TITLE;
        else if(!vm.studentInfo.connectVideo || !vm.studentInfo.isOpenVideo)
            title = VC.ROUTER.LIVEBIG.LIVE_NO_STATUS_TITLE;
        return title;
    };
    vm.studentInfo.chatStatusTitle = function(){        //学生聊天状态提示
        var title = "";
        if(vm.studentInfo.isBanChat)
            title = VC.ROUTER.LIVEBIG.LIVE_CHAT_STATUS_TITLE;
        return title;
    };
    vm.studentInfo.showAvatar = function(){         //显示头像
        if(vm.studentInfo.avatar === ""){
            return vm.studentInfo.avatar;
        }else{
            return {
                'background-image': 'url('+vm.studentInfo.avatar+')',
                'background-size': '100% 100%'
            }
        }
    };
    //学生左侧控制台-------------------------------------------------------------------------------end
//===重构=====================================================================================end

}]);


