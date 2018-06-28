//自定义过滤器

//聊天总数
classRoomModule.filter('msgcount',[function(){
    return function(str,obj){
        if(obj){
            return str = 0;
        }
        var str = str;
        if(parseInt(str) > 99){
            str = '99+';
        }
        return str;
    }
}]);
//私信总数
classRoomModule.filter('privatemsgcount',[function(){
    return function(str,obj){
        var str = str;
        if(parseInt(str) > 99){
            str = '99+';
        }
        return str;
    }
}]);
//在线人数
classRoomModule.filter('onlinemembers',[function(){
    return function(str,obj){
        var str = str;
        if(obj){
            str = parseInt(str) - 2;        // 排除老师和自己
        }else{
            str = parseInt(str) - 1;        //排除自己
        }
        return str;
    }
}]);



