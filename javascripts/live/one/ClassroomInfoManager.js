
var ClassroomInfoModule = ClassroomInfoModule || {};

function ClassroomInfoManager(classRoomController){
    this.classRoomController = classRoomController;
    ClassroomInfoModule.instance = this;
}

var role;   //用户角色
var userid; //用户ID
var roomId;   //房间ID

ClassroomInfoManager.prototype = {

    init : function(){
        role = $('#role').val();    //用户角色
        userid = $('#userid').val();    //用户ID
        roomId = $('#classRoomId').val();   //房间ID
    },
    onReceive : function(data){
        var data =  JSON.parse(data);
        if(data.cmd !== "robot:reply")
            console.debug(data);
        if(data.cmd == "classroom:join"){
            if(data.userid == userid){
                if(!data.isReConnect)
                    ClassroomInfoModule.instance.setClassroomInfoData(data);
            }else{
                if(!data.isReConnect)
                    ClassroomInfoModule.instance.updateClassroomInfoDataOtherJoin(data);
            }
            ClassroomInfoModule.instance.setCourseTitle(data.classroom.name);          //设置课程标题
            ClassroomInfoModule.instance.setClassroomType(data.classroom.quota);       //设置课程类型(1对1,小班,大班)
            ClassroomInfoModule.instance.setClassroomMode(data.controlpanel.inclass);  //设置课堂模式--0:授课 1:讨论
            ClassroomInfoModule.instance.setOpenClass(data.classroom.ispublic);        //设置公开课
            ClassroomInfoModule.instance.setTeaWhiteboardStatus(data.show);             //设置老师白板开启状态
            ClassroomInfoModule.instance.setShareWhiteBoardStatus(data.controlpanel.sharewhiteboard==1);                   //设置共享白板
            ClassroomInfoModule.instance.setSharePCVideoStatus(data.classroom.showscreen);//设置共享屏幕
            ClassroomInfoModule.instance.setCurrentVideo(data.videoid);                //老师主画面的视频id;老师：'t_1','t_2';学生：userid
            ClassroomInfoModule.instance.setHasmeeting(data.hasmeeting);               //记录会议是否创建
            ClassroomInfoModule.instance.setTeacherControlAllVideoStatus(data.controlpanel.forbidenvideo);//记录老师控制所有学生视频的状态
            ClassroomInfoModule.instance.setTeacherControlAllAudioStatus(data.controlpanel.forbidenaudio);//记录老师控制所有学生音频的状态
            if(data.isteacher) {
                ClassroomInfoModule.instance.setTeacherInfo(data);                         //记录老师信息
            }else{
                if(userid == data.userid){
                    ClassroomInfoModule.instance.setStudentInfo(data);                     //记录学生信息
                    var index = ClassroomInfoModule.instance._findTeacherIndexByMembers(data.members);
                    if(index != null){
                        ClassroomInfoModule.instance.setTeacherInfo(data.members[index]);
                    }
                }
            }
        }else if(data.cmd == "controlpanel:inclass"){                   //老师切换课程模式
            ClassroomInfoModule.instance.setClassroomMode(data.status);
        }else if(data.cmd == "chat:quit"){
            if(role == 2 && data.isteacher){
                ClassroomInfoModule.instance.cleanTeacherInfo();
            }
        }
    },
    _findTeacherIndexByMembers : function(members){
        if(members == null || members.length < 1)
            return null;
        var tidx = null;
        $.each(members,function(index,member){
            if(member.roleid == 1){
                tidx = index;
            }
        });
        return tidx;
    },
    //待实现方法区-----start
    cleanTeacherInfo : function(){
        //TODO::清除老师信息
    },
    setCourseTitle : function(data){
        //TODO::设置课程标题
    },
    setClassroomInfoData : function(data){
        //TODO::记录data
    },
    updateClassroomInfoDataOtherJoin : function(data){
        //TODO::更新data
    },
    setClassroomType : function(typeValue){
        //TODO::设置课程类型
    },
    setClassroomMode : function(value){
        //TODO::设置课堂模式
    },
    setOpenClass : function(openClassValue){
        //TODO::设置公开课
    },
    setTeaWhiteboardStatus : function(status){
        //TODO::设置白板开启状态
    },
    setShareWhiteBoardStatus : function(status){
        //TODO::设置白板共享
    },
    setSharePCVideoStatus : function(status){
        //TODO::设置共享屏幕状态
    },
    setCurrentVideo : function(value){
        //TODO::设置老师当前视频是第几个
    },
    setHasmeeting : function(value){
        //TODO::记录会议是否创建
    },
    setTeacherControlAllVideoStatus : function(value){
        //TODO::记录老师控制所有学生视频的状态
    },
    setTeacherControlAllAudioStatus : function(value){
        //TODO::记录老师控制所有学生音频的状态
    },
    setTeacherInfo : function(data){
        //TODO::记录老师信息
    },
    setStudentInfo : function(data){
        //TODO::记录学生信息
    },
    setAllowHandup : function(status){
        //TODO::设置允许举手状态
    },
    setAllowHandupTime : function(value){
        //TODO::设置允许举手剩余时间
    }
    //待实现方法区-----end
};