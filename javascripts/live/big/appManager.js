var classRoomModule = angular.module('ClassRoomModule', ['ui.bootstrap','ngSanitize']);
classRoomModule.run(function ($rootScope) {
    //课程标题
    $rootScope.$on('courseTitle',function(evt, args){
        $rootScope.$broadcast('setCourseTitle',args);
        $rootScope.headTitle = args;
    });
    //申请延时
    $rootScope.$on('delayShow',function(evt, args){
        $rootScope.$broadcast('setDelayShow',args);
    });
    //超时提醒
    $rootScope.$on('nomoretime', function (evt, args) {
        $rootScope.$broadcast('delayRemind', args);
    });
    //课件转换进度
    $rootScope.$on('courseware',function(evt,args){
        $rootScope.$broadcast('coursewareTransformation',args);
    });
    //显示课件转换进度
    $rootScope.$on('setcoursewareshow',function(evt,args){
        $rootScope.$broadcast('coursewareshow',args);
    });
    //结束课堂
    $rootScope.$on('user_leave',function(evt,args){
        $rootScope.$broadcast('leave',args);
    });
});