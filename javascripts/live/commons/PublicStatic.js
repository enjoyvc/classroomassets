/**
    静态类
    描述:存放公共常量,公共方法
 */
var PublicStatic = {};

PublicStatic.StaticClass = (function(){

    var Return = {
        isReConnect : false,
        roleT : '1',
        roleS : '2',
        clone : function(obj){//克隆对象
            var o,i,j,k;
            if(typeof(obj)!="object" || obj===null)return obj;
            if(obj instanceof(Array))
            {
                o=[];
                i=0;j=obj.length;
                for(;i<j;i++)
                {
                    if(typeof(obj[i])=="object" && obj[i]!=null)
                    {
                        o[i]=arguments.callee(obj[i]);
                    }
                    else
                    {
                        o[i]=obj[i];
                    }
                }
            }
            else
            {
                o={};
                for(i in obj)
                {
                    if(typeof(obj[i])=="object" && obj[i]!=null)
                    {
                        o[i]=arguments.callee(obj[i]);
                    }
                    else
                    {
                        o[i]=obj[i];
                    }
                }
            }
            return o;
        },
        findIndexFromMembersById : function(userid,members){        //根据ID从列表中获取索引
            _checkMembers(members);
            _checkUserid(userid);
            var idx = null;
            $.each(members,function(index,o){
                if(o.userid == userid){
                    idx = index;
                    return false;
                }
            });
            return idx;
        },
        findObjectFromMembersByIndex : function(index,members){     //根据索引从列表中获取对象
            _checkMembers(members);
            _checkIndex(index);
            var obj = null;
            $.each(members,function(i,o){
                if(index == i){
                    obj = o;
                    return false;
                }
            });
            return obj;
        },
        findObjectByIdAndMembers : function(userid,members){    //根据用户id和members查找对象
            _checkMembers(members);
            _checkUserid(userid);
            var obj = null;
            $.each(members,function(index,o){
                if(o.userid == userid){
                    obj = o;
                    return false;
                }
            });
            return obj;
        },
        findTeacherObjectFromMembers : function(members){           //根据members,查找老师对象
            _checkMembers(members);
            var obj = null;
            $.each(members,function(i,o){
                if(o.roleid == '1'){
                    obj = o;
                    return false;
                }
            });
            return obj;
        },
        isTeacherByRole : function(role){                   //根据role值判断是否为老师
            if(role == this.roleT)
                return true;
            return false;
        },
        checkMembers : function(members){       //检查members
            _checkMembers(members);
        },
        checkUserid : function(userid){         //检查userid
            _checkUserid(userid);
        },
        checkIndex : function(index){           //检查index
            _checkIndex(index);
        },
        changeMainScreenWidthAndHeight : function(){        //改变主窗口大小
            //视频----start
            var videoHeight = $('#center').height();
            var videoWidth = $('#center').width();
            $('#divVideoRemote video').css("height",videoHeight);
            $('#divVideoRemote video').css("width",videoWidth);
            $('#divVideoRemote video').css('margin','0 auto');
            //视频----end
            //白板----start
            var whiteboardHeight = $('#center').height() - 34;
            var whiteboardWidth = $('#center').width();
            $("#v-box-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
            $("#back-canvas").css({width:whiteboardWidth, height:whiteboardHeight});
            $("#top-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
            $("#drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
            $("#show-drawing-canvus").css({width:whiteboardWidth, height:whiteboardHeight});
            var canvas = document.getElementById("drawing-canvus");
            var context = canvas.getContext("2d");
            var canvas_show = document.getElementById("show-drawing-canvus");
            var context_show = canvas_show.getContext("2d");
            var canvas_top = document.getElementById("top-canvus");
            var canvas_top_context = canvas_top.getContext("2d");
            var canvas_back = document.getElementById("back-canvas");
            var canvas_back_context = canvas_back.getContext("2d");
            var xy=$(canvas).width() + "," + $(canvas).height();
            setTimeout(function(){
                $("#drawing-canvus").trigger("screenchage", xy);
            },1000);
            //白板----end
        },
        maxMessageWindowCss : function(){       //最大化聊天窗口改变样式
            $("#msg-box").css("height",$(window).height()-70);
            $("#msg-box #cont").css("height",$(window).height()-82-$(".chat").outerHeight()-$("#msg-box .title").outerHeight());
            $(".center").css("margin-right",'370px');
        },
        minMessageWindowCss : function(){       //最小化聊天窗口改变样式
            $('#msg-box').removeAttr('style');
            $("#msg-box #cont").removeAttr('style');
            $(".center").css("margin-right",'70px');
        },
        findStudentByKeywordAndMembers : function(keyword,members){               //根据关键字和列表模糊查询列表中的学生
            var vResult = [];
            if(keyword != null && keyword !== ""){
                var nPos;
                for(var i in members){
                    var uName = members[i].username||'';
                    nPos = _findIndex(keyword,uName);
                    if(nPos>=0){
                        vResult[vResult.length] = members[i];
                    }
                }
            }
            return vResult;
        },
        validateByValue : function(value){      //验证数据是否合格(undefined,null,''都是不合格)
            if(typeof value === 'undefined' || value == null || value === ''){
                return false;
            }
            return true;
        },
        tsk_string_random : function(i_length){//生成随机数
            var s_dict = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            return _tsk_string_random_from_dict(i_length, s_dict);
        }
    };
    var _tsk_string_random_from_dict = function(i_length, s_dict){//生成随机数
        var s_ret = "";
        for (var i = 0; i < i_length; i++) {
            s_ret += s_dict[Math.floor(Math.random() * s_dict.length)];
        }
        return s_ret;
    };
    var _checkMembers = function(members){              //检查members
        if(typeof members === 'undefined' || members == null){
            throw Error("members不存在或者数据为空");
        }
    };
    var _checkUserid = function(userid){            //检查userid
        if(typeof userid === 'undefined' || userid == null || userid === ""){
            throw Error("userid不存在或者数据为空");
        }
    };
    var _checkIndex = function(index){            //检查index
        if(typeof index === 'undefined' || index == null || index === ""){
            throw Error("index不存在或者数据为空");
        }
    };
    var _findIndex = function(keyword, uName){      //获取模糊查询结果索引
        var nSize = keyword.length;
        var nLen = uName.length;
        var sCompare;
        if(nSize <= nLen ){
            for(var i = 0; i <= nLen - nSize + 1; i++){
                sCompare = uName.substring(i, i + nSize);
                if(sCompare == keyword){
                    return i;
                }
            }
        }
        return -1;
    };

    return Return;
})()