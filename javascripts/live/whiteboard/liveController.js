classRoomModule.controller('liveController',['$scope','liveFactory','$log','$sce','$interval','$timeout','$modal',
    function($scope,liveFactory,$log,$sce,$interval,$timeout,$modal){
    var classRoomControler = new ClassRoomController();
    classRoomControler.init();
    var userManager = classRoomControler.getUserManager();                  //用户
    var classroomInfoManager = classRoomControler.getClassroomInfoManager();//会议室信息
    var whiteBoardManager = classRoomControler.getWhiteBoardManager();      //白板
    var chatManager = classRoomControler.getChatManager();                  //聊天
    var liveManager = classRoomControler.getLiveManager();                  //视频
    
    /**
     * 初始化WS及事件
     */
    var initWS = function(){
        classRoomControler.initWS();
    };
    /**
     * 获取参数
     */
    var getInitParam = function(callback){
    	var url = "/classroom/room/param" + window.location.search;
        liveFactory.get(url).then(function(data){
            if(data.success){
                classRoomControler.role = data.roleId;
                classRoomControler.classRoomID = data.roomId;
                classRoomControler.userID = data.userId;
                classroomInfoManager.roomId = data.roomId;
                userManager.userid = data.userId;
                userManager.username = data.username;
                userManager.role = data.roleId;
                liveManager.url = data.liveHost;
                liveManager.port = data.vedioPort;
                liveManager.mydomain = data.vedioDomain;
                liveManager.txtArea = data.vedioArea;
                liveManager.createMeetingParam = data.createMeetingParam;
                liveManager.meetingType = data.meetingControlType;
                callback();
                whiteBoardManager._initPage();
            }else{
                throw new Error(data.message);
            }
        });   	
    };
    getInitParam(initWS);
    
    //常量区域
    var tpromise = null;           //老师定时器
    var videopromise = null;       //走马灯定时器
    var s_s_w = 114;       //订阅的学生视频宽度
    var s_s_h = 84;        //订阅的学生视频高度
    var stopClickChangeClassroomMode = false;       //切换课堂模式
    var clickVideoPromise = false;       //防止频繁点击本地视频设备
    var clickAudioPromise = false;       //防止频繁点击本地音频设备
    var controlAllVideoPromise = false;              //防止老师频繁点击控制所有学生摄像头
    var clickVideoPromiseTime = 3000;
    var clickAudioPromiseTime = 3000;
    var controlAllVideoPromiseTime = 3500;
    var stopClickVideo = false;
    var stopClickAudio = false;

    var vm = $scope.vm = {};
    vm.classroomInfo = {};  //会议室信息
        vm.classroomInfo.searchKey = null; //列表搜索关键字
    vm.teacherInfo = {};    //用户为教师时信息
    vm.studentInfo = {};    //用户为学生时信息

    //controller通信-----------------------------------------------------------------------start
    $scope.$on('leave',function(evt,args){
        liveManager.leaveClassroom();
    });
    //controller通信-----------------------------------------------------------------------end
    //ClassroomInfoManager--------------------------------------------start
    var showMessageWindow = function(msg){      //信息提示框
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
    var operationMessageWindow = function(msg){//操作提示框
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
    var openErrorWindow = function(msg){//错误提示框
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
    classroomInfoManager.setCourseTitle = function(data){        //设置课程标题
        $scope.$emit('courseTitle',data);
    };
    classroomInfoManager.showMessageWindow = function(msg){     //信息提示
        return showMessageWindow(msg);
    };
    classroomInfoManager.operationMessageWindow = function(msg){//操作提示
        return operationMessageWindow(msg);
    };
    classroomInfoManager.openErrorWindow = function(msg){//错误提示
        return openErrorWindow(msg);
    };
    //ClassroomInfoManager--------------------------------------------end
    //whiteBoardManager-------------------------------------------------------start
    whiteBoardManager.coursewareTransformation = function(data){     //课件转换进度
        var documentObj = new Object();
        documentObj.documentindex = data.documentindex;
        documentObj.total = data.total;
        documentObj.errorcount = data.errorcount;
        $scope.$emit('courseware',documentObj);
    };
    //whiteBoardManager------------------------------------------------end
    //视频----------------------------------------------------------------------------------start
    //LiveManager待实现方法区--------------------------------------------------start
    liveManager.applyData = function(){
        $scope.$apply();
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
            var command = PublicStatic.StaticClass.clone(liveManager.getDefaultCmdParam());
            command.cmd = 'controlpanel:setdelay';
            command.minuts = result;
            classRoomControler.sendMessage(command);
        });
    };
    liveManager.setDelayRemindCss = function(status){           //设置课堂时间提示闪烁状态
        $scope.$emit('nomoretime',status);
    };
    liveManager.setDelayShowStatus = function(value){           //设置申请延时的显示状态
        $scope.$emit('delayShow',value);
    };
    liveManager.quitClassRoomJump = function(){                 //退出课室跳转页面
        var quitUrl = '/classroom/room/detail/user'+'?roomId='+classroomInfoManager.getRoomId()+'&userId='+userManager.getUserid();
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
    var _userIsCanChangeVideo = function(value){                  //判断能否进行切换
        var vsrc = null;
        if(value == 't_1'){              //判断要切换的是否为老师的第一个视频
            vsrc = $('#divVideoLocal_a video').attr('src');
        }else if(value == 't_2'){        //判断要切换的是否为老师的第一个视频
            vsrc = $('#divVideoLocal_b video').attr('src');
        }else{
            var obj = classroomInfoManager.findObjectByIdAndMembers(value,classroomInfoManager.getMembers());
            if(obj != null){
                var uid = obj.userid;
                vsrc = $('#' + uid + ' video').attr('src');
            }
        }
        if(typeof vsrc === 'undefined' || vsrc == null){
            return false;
        }
        return true;
    };
    var _userIsCanChangeVideoBySearch = function(value){        //判断能进行切换--搜索
        var vsrc = null;
        var obj = classroomInfoManager.findObjectByIdAndMembers(value,classroomInfoManager.getMembers());
        if(obj != null){
            var uid = obj.userid;
            vsrc = $('#search_' + uid + ' video').attr('src');
        }
        if(typeof vsrc === 'undefined' || vsrc == null){
            return false;
        }
        return true;
    };
    var _userIsCanChangeVideoByHandup = function(value){        //判断能否进行切换--举手
        return userManager.isCanChangeVideoByHandupByValue(value);
    };
    var _subscribeSearchResultVideo = function(){                       //订阅搜索结果视频
        $.each(classroomInfoManager.getSearchMembers(),function(index,member){
            //搜索太快,值虽然已经赋值,但是model还没触发改变页面,此时页面还没有元素,导致_this获取不到元素,延时500毫秒是为了保证页面已经渲染
            $timeout(function(){
                var id = 'search_' + member.userid;
                var source_id = _findSourceIdByUserVideoInfos(member.videoInfos);
                var param = liveManager.createSubscribeVideoParam(id,s_s_w,s_s_h,source_id,member.userid,2,'video');
                if(source_id != null && source_id !== ""){
                    liveManager._subscribe(param);
                }
            },500);
        });
    };
    var _subscribeCarouseVideo = function(){                    //订阅走马灯前show个学生视频
        var number = 1;
        $.each(classroomInfoManager.getMembers(),function(index,member){
            if(number <= classroomInfoManager.getScrollMembersCount()){
                if(member.roleid == 2){
                    _subscribeVideo(index);
                    number++;
                }
            }
        });
    };
    var _changeHandupCss = function(){          //改变举手闪烁样式
        $.each(userManager.getHandupList(),function(index,member){
            var command = PublicStatic.StaticClass.clone(liveManager.getDefaultCmdParam());
            command.cmd = 'userctrl:handspeak';
            command.status = 0;
            command.userid = member.userid;
            command.userName = member.username;
            liveManager.classRoomController.sendMessage(command);
        });
    };
    //私有方法区------------------------------------------------------------end
    vm.teacherInfo.changeVideo = function(value){                        //老师切换视频
        if(!_userIsCanChangeVideo(value)){
            var msg = VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
            classroomInfoManager.showMessageWindow(msg);return;
        }
        liveManager._hangupSubscribeHandup();
        whiteBoardManager.isOpenWhiteboard = false;               //关闭白板
        whiteBoardManager.isOpenTools = false;          //关闭工具条
        whiteBoardManager.isOpenShareWhiteboard = false;          //关闭白板共享
        whiteBoardManager._sendPixelMessage("done", 8, "", "8#1,1", false, 0);
        classroomInfoManager.teacherCurrentVideo = value;
        liveManager.changeVideoShow(value);
        if(value === 't_1' || value === 't_2'){
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
            classroomInfoManager.startScrollVideo();//开始走马灯
        }else{                              //切至别人,停止走马灯
            classroomInfoManager.stopScrollVideo();
        }
    };
    vm.teacherInfo.changeVideoBySearch = function(value){           //老师切换视频--搜索
        if(!_userIsCanChangeVideoBySearch(value)){
            var msg = VC.ROUTER.LIVEBIG.NO_THIS_VIDEO;
            classroomInfoManager.showMessageWindow(msg);return;
        }
        liveManager._hangupSubscribeHandup();
        whiteBoardManager.isOpenWhiteboard = false;               //关闭白板
        whiteBoardManager.isOpenTools = false;          //关闭工具条
        whiteBoardManager.isOpenShareWhiteboard = false;          //关闭白板共享
        whiteBoardManager._sendPixelMessage("done", 8, "", "8#1,1", false, 0);
        classroomInfoManager.teacherCurrentVideo = value;
        liveManager.changeVideoShow(value);
        if(value === 't_1' || value === 't_2'){
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
            classroomInfoManager.startScrollVideo();//开始走马灯
        }else{
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
        }
    };
    vm.teacherInfo.endHandupList = function(){                  //结束本次发问
        //让选择发言的学生挂掉音频,关闭列表窗口,清空列表,清空选中学生
        if(!classroomInfoManager.isTeachingMode()){
            var msg = VC.ROUTER.LIVEBIG.DISCUSSION_NO_OPERATION;
            classroomInfoManager.showMessageWindow(msg);return;
        }
        if(!classroomInfoManager.getAllowHandup()){
            var msg2 = VC.ROUTER.LIVEBIG.LIVE_CLOSE_HANDUP_TIPS;
            classroomInfoManager.showMessageWindow(msg2);return;
        }
        if(!userManager.isEmptyForHandupSelectStudent()) {
            $.each(classroomInfoManager.getMembers(),function(i,o){
                if(o.userid == userManager.handupSelectStudent.userid){
                    if(o.stopspeak==2){
                        liveManager.banPublishAudio(userManager.handupSelectStudent);
                        return false;
                    }
                }
            });
        }
        $interval.cancel(tpromise);
        tpromise = null;
        _changeHandupCss();
        classroomInfoManager.allowHandup = false;
        userManager.handupList = [];
        userManager.handupSelectStudent = null;
        var command = PublicStatic.StaticClass.clone(liveManager.getDefaultCmdParam());
        command.cmd = 'controlpanel:switch_global_raise_hand_permission';
        command.status = classroomInfoManager.getAllowHandup()?0:1;
        command.time = null;
        classRoomControler.sendMessage(command);
        if(classroomInfoManager.getTeacherWhiteboardStatus())return;
        //--->判断老师当前是否有第一个，有则跳转，无则跳转至第二个，都无则跳转至白板
        if(_userIsCanChangeVideo('t_1')){
            vm.teacherInfo.changeVideo('t_1');
        }else if(_userIsCanChangeVideo('t_2')){
            vm.teacherInfo.changeVideo('t_2');
        }else{
            if(!whiteBoardManager.getIsOpenWhiteboard())
                vm.openOrCloseWhiteboard();
        }
    };
    vm.teacherInfo.selectHandupStudent = function(stuobj){      //选择学生举手列表的学生
        if(!userManager.isEmptyForHandupSelectStudent()){//是否已经选中了该学生
            if(stuobj.userid == userManager.handupSelectStudent.userid){
                var message = VC.ROUTER.LIVEBIG.LIVE_CHOOSE_HANDUP_TIPS;
                classroomInfoManager.showMessageWindow(message);
                return;
            }else{
                liveManager.banPublishAudio(userManager.handupSelectStudent);
                classroomInfoManager.updateUserStopspeakValueFromMembersByUseridAndValue(userManager.handupSelectStudent.userid,1);
                userManager.handupSelectStudent = null;
            }
        }
        userManager.addUserToHandupSelectStudentByObject(stuobj);
        var obj = classroomInfoManager.findObjectByIdAndMembers(stuobj.userid,classroomInfoManager.getMembers());
        if(stuobj.stopspeak==1){      //只有音频处于被禁止状态下的学生，老师才能打开
            liveManager.noBanPublishAudio(stuobj);                                          //--->通知该学生取消禁止音频
        }
        if(obj != null){
            liveManager._hangupSubscribeHandup();                    //--->先挂机原来的视频
            var source_id = _findSourceIdByUserVideoInfos(stuobj.videoInfos);
            if(source_id != null && source_id !== "" && obj.stopvideo == 2){       //学生已发布
                whiteBoardManager.isOpenWhiteboard = false;               //关闭白板
                whiteBoardManager.isOpenTools = false;          //关闭工具条
                whiteBoardManager.isOpenShareWhiteboard = false;          //关闭白板共享
                whiteBoardManager._sendPixelMessage("done", 8, "", "8#1,1", false, 0);
                classroomInfoManager.teacherCurrentVideo = stuobj.userid;
                var param = liveManager.createSubscribeVideoParam('handupVideo',s_s_w,s_s_h,source_id,stuobj.userid,2,'video');
                $('#handupVideo').html();
                liveManager._subscribeHandup(param);//--->订阅该学生视频
                liveManager.handupStudentShow(stuobj.userid);                                       //--->切换该学生视频
            }else if(obj.stopvideo == 1){          //学生被禁止
                whiteBoardManager.isOpenWhiteboard = false;               //关闭白板
                whiteBoardManager.isOpenTools = false;          //关闭工具条
                whiteBoardManager.isOpenShareWhiteboard = false;          //关闭白板共享
                whiteBoardManager._sendPixelMessage("done", 8, "", "8#1,1", false, 0);
                liveManager.noBanPublishVideo(stuobj);           //先开启该学生的视频
                var HandupSubVideoPromise = $interval(function(){           //定时检测订阅时机
                    var obj2 = classroomInfoManager.findObjectByIdAndMembers(stuobj.userid,classroomInfoManager.getMembers());
                    if(obj2!=null && obj2.stopvideo==2){       //该学生已发布才去订阅
                        var source_id = _findSourceIdByUserVideoInfos(obj2.videoInfos);
                        var param = liveManager.createSubscribeVideoParam('handupVideo',s_s_w,s_s_h,source_id,stuobj.userid,2,'video');
                        $('#handupVideo').html();
                        if(source_id!=null){
                            liveManager._subscribeHandup(param);//再订阅该学生
                        }
                        $interval.cancel(HandupSubVideoPromise);
                        HandupSubVideoPromise = null;
                    }
                },2000);
                var HandupChangeVideoPromise = $interval(function(){            //定时检测切换时机
                    if(_userIsCanChangeVideoByHandup(stuobj.userid)){
                        liveManager.handupStudentShow(stuobj.userid);                                       //--->切换该学生视频
                        classroomInfoManager.teacherCurrentVideo = stuobj.userid;
                        $interval.cancel(HandupChangeVideoPromise);
                        HandupChangeVideoPromise = null;
                    }
                },2000);
            }else if(obj.stopvideo==0){           //如果该学生没有视频,直接切回老师视频
                userManager.handupSelectStudent = null;
                if(classroomInfoManager.getTeacherWhiteboardStatus())return;
                if(_userIsCanChangeVideo('t_1')){//--->判断老师当前是否有第一个，有则跳转，无则跳转至第二个，都无则跳转至白板
                    vm.teacherInfo.changeVideo('t_1');
                }else if(_userIsCanChangeVideo('t_2')){
                    vm.teacherInfo.changeVideo('t_2');
                }else{
                    if(!whiteBoardManager.getIsOpenWhiteboard())
                        vm.openOrCloseWhiteboard();
                }
            }
        }
    };
    vm.teacherInfo.selectStudent = function(){                  //模糊查询学生
        var findResult = PublicStatic.StaticClass.findStudentByKeywordAndMembers(vm.classroomInfo.searchKey,classroomInfoManager.getMembers());
        if(vm.classroomInfo.searchKey != null && vm.classroomInfo.searchKey !== ""){
            classroomInfoManager.searchMembers = findResult;     //搜索结果
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
            liveManager.hangupAllSubSip();      //挂机订阅过的所有视频
            userManager.isShowScrollView = false;            //切换至搜索结果视图
            _subscribeSearchResultVideo();      //订阅搜索结果视频
        }else{
            liveManager.hangupAllSubSip();      //挂机搜索结果列表的视频
            classroomInfoManager.searchMembers = [];        //清除搜索结果
            _subscribeCarouseVideo();           //订阅走马灯前show个视频
            userManager.isShowScrollView = true;     //切换至走马灯视图
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
            classroomInfoManager.startScrollVideo();//开始走马灯
        }
    };
    //老师左侧控制台-------------------------------------------------------------------------------end
    //学生左侧控制台-----------------------------------------------------------------------------start
    vm.studentInfo.selectStudent = function(){              //学生模糊查询
        var findResult = PublicStatic.StaticClass.findStudentByKeywordAndMembers(vm.classroomInfo.searchKey,classroomInfoManager.getMembers());
        if(vm.classroomInfo.searchKey != null && vm.classroomInfo.searchKey !== ""){
            classroomInfoManager.searchMembers = findResult;    //赋值搜索结果
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
            userManager.isShowScrollView = false;            //切换至搜索结果视图
        }else{
            classroomInfoManager.searchMembers = [];    //清除搜索结果
            userManager.isShowScrollView = true;     //切换至走马灯视图
            classroomInfoManager.stopScrollVideo();//先停(防止前一个interval没有清除)
            classroomInfoManager.startScrollVideo();//开始走马灯
        }
    };
    //学生左侧控制台-------------------------------------------------------------------------------end
    //走马灯-----------------------------------------------------------------------------------start
    var _isCanCarouse = function(){                //是否可以切换
        var num = 0;
        $.each(classroomInfoManager.getMembers(),function(index,member){
            if(member.roleid == 2){
                num++;
            }
        });
        if(PublicStatic.StaticClass.isTeacherByRole(userManager.getRole())) {
            if (num >= classroomInfoManager.getScrollMembersCount()) {
                return true;
            } else {
                return false;
            }
        }else{
            if ((num - 1) >= classroomInfoManager.getScrollMembersCount()) {
                return true;
            } else {
                return false;
            }
        }
    };
    var _findFirstMember = function(){     //获取members里面的第一个学生索引
        var idx = null;
        $.each(classroomInfoManager.getMembers(),function(index,member){
            if(member.roleid == 2){
                idx = index;
                return false;
            }
        });
        return idx;
    };
    var _hangupVideo = function(index){     //挂机视频
        if(index != null) {
            var obj = classroomInfoManager.findObjectFromMembersByIndex(index);
            var sub_hid = liveManager.findSubHidByUserid(obj.userid);
            if(sub_hid != null && sub_hid !== "") {
                $('#'+obj.userid).html();
                liveManager.handUpSubSip(sub_hid);
            }
        }
    };
    var _moveFirstStudentToLast = function(index){    //移动第一个学生至最后
        var tempObj = classroomInfoManager.findObjectFromMembersByIndex(index);
        if(tempObj != null){
            classroomInfoManager.deleteUserFromMembersByIndex(index);
            classroomInfoManager.addUserToMembersByObject(tempObj);
        }
    };
    var _findNextMember = function(){                //获取members里面的下一个要显示的学生的索引
        var idx = null;
        var num = 0;
        $.each(classroomInfoManager.getMembers(),function(index,member){
            if(member.roleid == 2){
                num++;
                if(num == classroomInfoManager.getScrollMembersCount()){
                    idx = index;
                    return false;
                }
            }
        });
        return idx;
    };
    var _findSourceIdByUserVideoInfos = function(videoInfos){       //获取订阅视频的资源id
        var source_id = null;
        $.each(videoInfos,function(index,media){
            if(media.sourceName === "video" && media.sourceId !== ""){
                source_id = media.sourceId;
                return false;
            }
        });
        return source_id;
    };
    var _subscribeVideo = function(next){       //订阅视频
        if(next != null) {
            var obj = classroomInfoManager.findObjectFromMembersByIndex(next);
            if (obj != null){
                var source_id = classroomInfoManager.findSourceidFromMembersByUseridAndType(obj.userid,"video");
                var param = liveManager.createSubscribeVideoParam(obj.userid,s_s_w,s_s_h,source_id,obj.userid,2,'video');
                if (source_id != null && source_id !== "") {
                    $('#' + obj.userid).html();
                    liveManager._subscribe(param);
                }
            }
        }
    };
    var _carouseVideo = function(){
        if(!_isCanCarouse()){
            classroomInfoManager.stopScrollVideo();
            return;
        }
        var _index = _findFirstMember();
        if(userManager.isTeacher()) {
            _hangupVideo(_index);
        }
        _moveFirstStudentToLast(_index);
        if(userManager.isTeacher()) {
            var _next = _findNextMember();
            $timeout(function () {
                _subscribeVideo(_next);
            }, 1000);
        }
    };
    classroomInfoManager.startScrollVideo = function(){//开始走马灯
        videopromise = $interval(function () {
            _carouseVideo();
        }, classroomInfoManager.getScrollMembersTime());
    };
    classroomInfoManager.stopScrollVideo = function(){//停止走马灯
        $interval.cancel(videopromise);
        videopromise = null;
    };
    //走马灯-----------------------------------------------------------------------------------end

    //中英文-------------------------------------------------------start
    $scope.HANGUP_LIST_NO_STUDENT_DESC = $sce.trustAsHtml(VC.ROUTER.LIVEBIG.HANDUP_LIST_NO_STUDENT_DESC);
    //中英文-------------------------------------------------------end


    vm.getRoomId = function(){      //获取课室id
        return classroomInfoManager.getRoomId();
    };
    vm.isTeachingMode = function(){     //是否为授课模式
        return classroomInfoManager.isTeachingMode();
    };
    vm.getMembers = function(){         //获取课室用户列表
        return classroomInfoManager.getMembers();
    };
    vm.getMembersLength = function(){   // 获取用户列表长度
        if(PublicStatic.StaticClass.isTeacherByRole(userManager.getRole()))
            return classroomInfoManager.getMembers().length - 1;
        else
            return classroomInfoManager.getMembers().length;
    };
    vm.getQuota = function(){           //获取课堂人数最大容量
        return classroomInfoManager.getQuota();
    };
    vm.getTeacherShareVideo = function(){   //共享屏幕状态
        return classroomInfoManager.getTeacherShareVideo();
    };
    vm.getTeacherCurrentVideo = function(){ //老师主画面
        return classroomInfoManager.getTeacherCurrentVideo();
    };
    vm.getTeacherId = function(){   //获取老师的id    //student--->>>view
        var obj = classroomInfoManager.findTeacherObjectFromMembers();
        return obj==null?null:obj.userid;
    };
    vm.getTeacherName = function(){ //获取老师的名字    //student--->>>view
        var obj = classroomInfoManager.findTeacherObjectFromMembers();
        return obj==null?null:obj.username;
    };
    vm.getTeacherOnline = function(){ //获取老师的在线状态  //teacher---student--->>>view
        var obj = classroomInfoManager.findTeacherObjectFromMembers();
        return obj==null?0:obj.online;
    };
    vm.getUserid = function(){  //获取用户id //teacher---student--->>>view
        return userManager.getUserid();
    };
    vm.isConnectFirstVideo = function(){    //是否连接第一个摄像头    //teacher--->>>view
        return userManager.isConnectFirstVideo();
    };
    vm.isConnectSecondVideo = function(){   //是否连接第二个摄像头    //teacher--->>>view
        return userManager.isConnectSecondVideo();
    };
    vm.isConnectAudio = function(){         //是否连接麦克风    //teacher---student--->>>view
        return userManager.isConnectAudio();
    };
    vm.isOpenAudio = function(){            //是否打开麦克风    //teacher---student--->>>view
        return userManager.getOpenAudioStatus();
    };
    vm.getSearchMembers = function(){       //获取搜索课室用户列表    //teacher---student--->>>view
        return classroomInfoManager.getSearchMembers();
    };
    vm.getAllowHandup = function(){         //获取允许举手状态      //teacher--->>>view
        return classroomInfoManager.getAllowHandup();
    };
    vm.getPrivateMessageLength = function(){        //获取私信列表长度
        return userManager.getPrivateMessage().length;
    };
    vm.isEmptyForPrivateMessage = function(){       //私信列表是否为空
        return userManager.isEmptyForPrivateMessage();
    };
    vm.getHandupList = function(){       //获取举手列表   //teacher--->>>view
        return userManager.getHandupList();
    };
    vm.getHandupListLength = function(){    //获取举手列表长度  //teacher--->>>view
        return userManager.getHandupList().length;
    };
    vm.isEmptyForHandupList = function(){       //举手列表是否为空  //teacher--->>>view
        return userManager.isEmptyForHandupList();
    };
    vm.getHandupListViewShow = function(){      //获取举手列表窗口显示状态  //teacher--->>>view
        return userManager.getHandupListViewShow();
    };
    vm.getHandupSelectStudent = function(){     //获取选中的的举手学生    //teacher--->>>view
        return userManager.getHandupSelectStudent();
    };
    vm.getIsShowChangeClassroomModeView = function(){   //获取是否显示切换课程模式窗口的状态     //teacher--->>>view
        return userManager.getIsShowChangeClassroomModeView();
    };
    vm.getIsShowScrollView = function(){            //获取是否显示走马灯视图的状态
        return userManager.getIsShowScrollView();
    };
    vm.isConnectVideo = function(){     //是否连接了摄像头      //student--->>>view
        return userManager.isConnectVideo();
    };
    vm.getOpenVideoStatus = function(){ //获取摄像头状态   //student--->>>view
        return userManager.getOpenVideoStatus();
    };
    vm.getBanVideoStatus = function(){  //获取禁止视频状态  //student--->>>view
        return userManager.getBanVideoStatus();
    };
    vm.getBanAudioStatus = function(){  //获取禁止音频状态  //student--->>>view
        return userManager.getBanAudioStatus();
    };
    vm.getIsHandupStatus = function(){  //获取是否已经举手的状态   //student--->>>view
        return userManager.getIsHandupStatus();
    };
    vm.getBanChatStatus = function(){   //获取禁止聊天状态  //student--->>>view
        return userManager.getBanChatStatus();
    };
    vm.getTeacherIsOpenAudio = function(){  //获取老师是否打开音频    //student--->>>view
        return userManager.getTeacherIsOpenAudio();
    };
    vm.getShowChatView = function(){        //获取讨论区显示状态    //teacher---student--->>>view
        return chatManager.getShowChatView();
    };
    vm.getMessageCount = function(){        //获取讨论信息总数   //teacher---student--->>>view
        return chatManager.getMessageCount();
    };
    vm.messageCountIsNotEmpty = function(){     //讨论区信息总数是否不为空  //teacher---student--->>>view
        if(chatManager.showChatView)    //当讨论区视图打开着时,总数算做0
            chatManager.messageCount = 0;
        return chatManager.messageCountIsNotEmpty();
    };
    vm.messageWindowIsMax = function(){     //讨论区是否最大化  //teacher---student--->>>view
        return chatManager.getMessageWindowIsMax();
    };
    vm.closeChatView = function(){      //关闭聊天窗口        //teacher---student--->>>view
        chatManager.closeChatView();
    };
    vm.clearMessage = function(){       //清除聊天信息        //teacher---student--->>>view
        chatManager.clearMessage();
    };
    vm.maxMessageWindow = function(){   //最大化聊天窗口       //teacher---student--->>>view
        chatManager.maxMessageWindow();
    };
    vm.minMessageWindow = function(){   //最小化聊天窗口       //teacher---student--->>>view
        chatManager.minMessageWindow();
    };
    vm.openOrCloseChatView = function(){ //打开或关闭聊天窗口 //teacher---student--->>>view
        chatManager.openOrCloseChatView();
    };
    vm.getStime = function(){           //teacher---student--->>>view
        return classroomInfoManager.getStime();
    };
    vm.getEtime = function(){           //teacher---student--->>>view
        return classroomInfoManager.getEtime();
    };
    vm.getSertime = function(){         //teacher---student--->>>view
        return classroomInfoManager.getSertime();
    };
    vm.getNowtime = function(){         //teacher---student--->>>view
        return classroomInfoManager.getNowtime();
    };
    vm.sendPublicMessage = function(){  //发送公聊信息       //teacher---student--->>>view
        chatManager.sendPublicMessage();
    };
    vm.controlChat = function(){    //老师控制讨论区发言     //teacher--->>>view
        userManager.controlChat();
    };
    vm.getControlAllStudentChatStatus = function(){ //获取老师控制所有学生的聊天开关状态     //teacher--->>>view
        return classroomInfoManager.getControlAllStudentChatStatus()==0;
    };
    vm.openOrCloseApp = function(){ //打开或关闭程序       //teacher--->>>view
        userManager.openOrCloseApp();
    };
    vm.setChatStatueByUser = function(item){   //左侧列表,老师控制学生讨论区发言  //teacher--->>>view
        userManager.setChatStatueByUser(item);
    };
    vm.openPrivateMessageWindowToUser = function(obj){//左侧列表,打开对其他人的私信窗口  //teacher---student--->>>view
        userManager.openPrivateMessageWindowToUser(obj);
    };
    vm.openPrivateMessage = function(){ //打开私信列表    //teacher---student--->>>view
        userManager.openPrivateMessage();
    };
    vm.getOpenFirstVideoStatus = function(){//返回老师第一个视频的开启状态    //teacher--->>>view
        return userManager.getOpenFirstVideoStatus();
    };
    vm.getOpenSecondVideoStatus = function(){//返回老师第二个视频的开启状态   //teacher--->>>view
        return userManager.getOpenSecondVideoStatus();
    };
    var _videoPromise = function(){//防止多次点击视频开关
        if(clickVideoPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            classroomInfoManager.showMessageWindow(msg);return;
        }
        clickVideoPromise = true;
        var stopClickVideoPromise = $timeout(function(){
            clickVideoPromise = false;
            $timeout.cancel(stopClickVideoPromise);
        },clickVideoPromiseTime);
        return clickVideoPromise;
    };
    var _audioPromise = function(){//防止多次点击音频开关
        if(clickAudioPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            classroomInfoManager.showMessageWindow(msg);return;
        }
        clickAudioPromise = true;
        var stopClickAudioPromise = $timeout(function(){
            clickAudioPromise = false;
            $timeout.cancel(stopClickAudioPromise);
        },clickAudioPromiseTime);
        return clickAudioPromise;
    };
    var _videoAllPromise = function(){//防止多次点击控制所有视频开关
        if(controlAllVideoPromise){
            var msg = VC.ROUTER.TEMPLATE_TIPS.STOP_QUICK_OPERATION;
            classroomInfoManager.showMessageWindow(msg);return;
        }
        controlAllVideoPromise = true;
        var stopControlAllVideoPromise = $timeout(function(){
            controlAllVideoPromise = false;
            $timeout.cancel(stopControlAllVideoPromise);
        },controlAllVideoPromiseTime);
        return controlAllVideoPromise;
    };
    var _videoSingleStudentPromise = function(){//防止多次点击单个学生的视频开关
        if(stopClickVideo){
            return;
        }
        stopClickVideo = true;
        var stopClickVideoPro = $timeout(function(){
            stopClickVideo = false;
            $timeout.cancel(stopClickVideoPro);
        },1000);
        return stopClickVideo;
    };
    var _audioSingleStudentPromise = function(){//防止多次点击单个学生的音频开关
        if(stopClickAudio){
            return;
        }
        stopClickAudio = true;
        var stopClickAudioPro = $timeout(function(){
            stopClickAudio = false;
            $timeout.cancel(stopClickAudioPro);
        },1000);
        return stopClickAudio;
    };
    var _changeClassroomModePromise = function(){//防止多次点击切换课程模式
        if(stopClickChangeClassroomMode){
            var msg = VC.ROUTER.LIVEBIG.LIVE_CLASSROOMMODE_SELECT_TIPS;
            classroomInfoManager.showMessageWindow(msg);
            return;
        }
        stopClickChangeClassroomMode = true;
        var stopClickChangeClassroomModePro = $timeout(function(){
            stopClickChangeClassroomMode = false;
            $timeout.cancel(stopClickChangeClassroomModePro);
        },4000);
        return stopClickChangeClassroomMode;
    };
    vm.firstVideoOnAndOff = function(){//老师开关第一个视频  //teacher--->>>view
        if(_videoPromise())
            userManager.firstVideoOnAndOff();
    };
    vm.secondVideoOnAndOff = function(){//老师开关第二个视频  //teacher--->>>view
        if(_videoPromise())
            userManager.secondVideoOnAndOff();
    };
    vm.audioOnAndOff = function(){//老师开关音频      //teacher---student--->>>view
        if(_audioPromise())
            userManager.audioOnAndOff();
    };
    vm.controlAllVideoIsOpen = function(){//控制所有学生视频的开关是否打开     //teacher--->>>view
        return userManager.controlAllVideoIsOpen();
    };
    vm.controlAllVideo = function(){//老师控制所有学生的视频开关     //teacher--->>>view
        if(_videoAllPromise())
            userManager.controlAllVideo();
    };
    vm.controlAllAudio = function(){//老师控制所有学生的音频开关    //teacher--->>>view
        userManager.controlAllAudio();
    };
    vm.controlSingleStudentVideoOpenOrBan = function(obj){//老师控制单个学生的视频开关    //teacher--->>>view
        if(_videoSingleStudentPromise())
            userManager.controlSingleStudentVideoOpenOrBan(obj);
    };
    vm.controlSingleStudentAudioOpenOrBan = function(obj){//老师控制单个学生的音频开关    //teacher--->>>view
        if(_audioSingleStudentPromise())
            userManager.controlSingleStudentAudioOpenOrBan(obj);
    };
    vm.showClassroomModeView = function(){//显示课程模式的切换视图                 //teacher--->>>view
        userManager.isShowChangeClassroomModeView = !userManager.isShowChangeClassroomModeView;
    };
    vm.shareScreenOnAndOff = function(){//共享屏幕      //teacher--->>>view
        userManager.shareScreenOnAndOff();
    };
    vm.changeClassroomMode = function(){//改变课程模式        //teacher--->>>view
        if(_changeClassroomModePromise()){
            classroomInfoManager.changeClassroomMode();
            vm.controlAllAudio();
            if(!classroomInfoManager.isTeachingMode()) {            //如果为讨论模式,改变举手样式，清空举手列表
                userManager.clearHandupListAndCss();
            }
        }
    };
    vm.allowHandupOpen = function(){//老师允许举手        //teacher--->>>view
        if(userManager.isCanAllowHandup())
            userManager.allowHandupOpen();
    };
    vm.handupListOpenAndClose = function(){//打开或关闭举手列表      //teacher--->>>view
        userManager.handupListOpenAndClose();
    };
    vm.closeHandupList = function(){//关闭举手列表      //teacher--->>>view
        userManager.closeHandupList();
    };
    vm.openPrivateMessageToTeacher = function(){//打开对老师的私聊信息    //student--->>>view
        userManager.openPrivateMessageToTeacher();
    };
    vm.videoOnAndOff = function(){//视频开关        //student--->>>view
        if(_videoPromise())
            userManager.videoOnAndOff();
    };
    vm.teacherVideoShowSwitch = function(){//学生界面老师视频显示切换       //student--->>>view
        return userManager.teacherVideoShowSwitch();
    };
    vm.handup = function(){//举手     //student--->>>view
        userManager.handup();
    };
    vm.audioStatusTitle = function(status){//学生麦克风状态提示      teacher---student--->>>view
        return userManager.audioStatusTitle(status);
    };
    vm.videoStatusTitle = function(status){//学生摄像头状态提示      teacher---student--->>>view
        return userManager.videoStatusTitle(status);
    };
    vm.chatStatusTitle = function(status){//聊天状态提示       teacher---student--->>>view
        return userManager.chatStatusTitle(status);
    };
    vm.handupStatusTitle = function(){//学生举手状态提示        student--->>>view
        return userManager.handupStatusTitle();
    };
    vm.showAvatar = function(){//学生显示头像         student--->>>view
        return userManager.showAvatar();
    };
    vm.showOtherUserAvatar = function(url){//显示其他用户的头像     teacher---student--->>>view
        return userManager.showOtherUserAvatar(url);
    };
    vm.addStudent = function(){//添加学生           teacher--->>>view
        userManager.addStudent();
    };
    vm.getIsOpenWhiteboard = function(){//获取是否打开白板状态        teacher---student--->>>view
        return whiteBoardManager.getIsOpenWhiteboard();
    };
    vm.getIsOpenTools = function(){//获取白板工具条是否打开状态      teacher---student--->>>view
        return whiteBoardManager.getIsOpenTools();
    };
    vm.getIsOpenShareWhiteboard = function(){//获取白板共享是否打开状态     teacher---student--->>>view
        return whiteBoardManager.getIsOpenShareWhiteboard();
    };
    vm.getCurrentPage = function(){//获取白板当前页码       teacher---student--->>>view
        return whiteBoardManager.getCurrentPage();
    };
    vm.getTotalPage = function(){//获取白板总页数      teacher---student--->>>view
        return whiteBoardManager.getTotalPage();
    };
    vm.uploadDocument = function(){//上传文档		//teacher--->>>view
    	var vcliveHost = $('#vcliveHost').val();
    	return vcliveHost + "/meeting/classroom/upload?roomId=" + vm.getRoomId() + "&key=3c246167fc5e36adf73849c8798d1111";
    };      
    vm.showColorBoard = function(){//获取显示调色板状态  teacher---student--->>>view
        return whiteBoardManager.getShowColorBoard();
    };
    vm.showLineType = function(){//获取线条窗口显示状态  teacher---student--->>>view
        return whiteBoardManager.getShowLineType();
    };
    vm.showTextWindow = function(){//获取文本输入窗口显示状态  teacher---student--->>>view
        return whiteBoardManager.getShowTextWindow();
    };
    vm.colorBoardOpenAndClose = function(){//调色板打开或关闭   teacher---student--->>>view
        whiteBoardManager.colorBoardOpenAndClose();
    };
    vm.lineTypeOpenAndClose = function(){//线条板打开或关闭   teacher---student--->>>view
        whiteBoardManager.lineTypeOpenAndClose();
    };
    vm.currentToolTypeIsEqualByType = function(type){//根据type判断是否为当前选中的工具     teacher---student--->>>view
        return whiteBoardManager.currentToolTypeIsEqualByType(type);
    };
    vm.textWindowClose = function(){//关闭文本输入窗口   teacher---student--->>>view
        whiteBoardManager.textWindowClose();
    };
    vm.isShowPageOperation = function(){//是否显示分页操作  teacher---student--->>>view
        return userManager.isTeacher() && whiteBoardManager.totalPage > 0;
    };
    vm.isShowFirstAndPreviousPage = function(){//是否显示第一页和上一页操作   teacher---student--->>>view
        return whiteBoardManager.isShowFirstAndPreviousPage();
    };
    vm.isShowLastAndNextPage = function(){//是否显示最后一页和下一页操作   teacher---student--->>>view
        return whiteBoardManager.isShowLastAndNextPage();
    };
    vm.openOrCloseWhiteboard = function(){//打开或关闭白板     teacher--->>>view
        userManager.openOrCloseWhiteboard();
    };
    vm.isOpenWhiteboard = function(){//是否打开白板    teacher--->>>view
        return whiteBoardManager.getIsOpenWhiteboard();
    };
    vm.shareWhiteboardOpenAndClose = function(){//白板共享打开或关闭     teacher--->>>view
        userManager.shareWhiteboardOpenAndClose();
    };
    vm.isOpenShareWhiteboard = function(){//是否已经打开白板共享   teacher--->>>view
        return whiteBoardManager.getIsOpenShareWhiteboard();
    };
    vm.getShowResolutionSelectViewStatus = function(){ //分辨率切换窗口显示状态         teacher--->>>view
        return liveManager.getShowResolutionSelectViewStatus();
    };
    vm.openAndCloseResolutionView = function(){//打开或关闭分辨率选择窗口       teacher--->>>view
        liveManager.openAndCloseResolutionView();
    };
    vm.isCurrentResolutionByValue = function(value){//根据value判断是否为当前视频分辨率类型    teacher--->>>view
        return tempResolutionTypeValue == value;
    };
    var tempResolutionTypeValue = 40;
    vm.selectResolution = function(value){//选择视频分辨率类型     teacher--->>>view
        tempResolutionTypeValue = value;
    };
    vm.commitVideoResolution = function(){//提交选择的视频分辨率   teacher--->>>view
        liveManager.currentResolution = tempResolutionTypeValue;
        userManager.commitVideoResolution();
        vm.openAndCloseResolutionView();
    };
    vm.getCurrentResolution = function(){//当前分辨率       teacher--->>>view
        return liveManager.getCurrentResolution();
    };
    vm.firstPage = function(){//第一页    teacher--->>>view
        whiteBoardManager.firstPage();
    };
    vm.lastPage = function(){//最后一页   teacher--->>>view
        whiteBoardManager.lastPage();
    };
    vm.previousPage = function(){//上一页  teacher--->>>view
        whiteBoardManager.previousPage();
    };
    vm.nextPage = function(){//下一页  teacher--->>>view
        whiteBoardManager.nextPage();
    };
    vm.selectCircle = function(){//选择圆  teacher---student--->>>view
        whiteBoardManager.selectCircle();
    };
    vm.selectParty = function(){//选择方   teacher---student--->>>view
        whiteBoardManager.selectParty();
    };
    vm.selectStraightline = function(){//选择直线   teacher---student--->>>view
        whiteBoardManager.selectStraightline();
    };
    vm.selectPen = function(){//选择画笔    teacher---student--->>>view
        whiteBoardManager.selectPen();
    };
    vm.selectEraser = function(){//选择橡皮擦  teacher---student--->>>view
        whiteBoardManager.selectEraser();
    };
    vm.selectCleanWhiteBoard = function(){//选择清除白板  teacher--->>>view
        whiteBoardManager.selectCleanWhiteBoard();
    };
    vm.selectTextInput = function(){//选择文本输入    teacher---student--->>>view
        whiteBoardManager.selectTextInput();
    };
    vm.selectLine = function(value){//选择线条    teacher---student--->>>view
        whiteBoardManager.selectLine(value);
    };
}]);