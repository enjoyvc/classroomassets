classRoomModule.controller('delayWindowController',['$scope','data','$modal','$modalInstance',function($scope,data,$modal,$modalInstance){

    var vm = $scope.vm = {};
    vm.data = data;
    vm.delayTime = null;
    vm.validErrorMessage = null;

    vm.sure = function(){
        var validResult = _validateDelayTime(vm.delayTime);
        if(validResult){
            $modalInstance.close(vm.delayTime);
        }else{
            var protocol = document.location.protocol;
            var hostName = window.location.host;
            var modalInstance = $modal.open({
                templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.OTHERMESSAGE,
                backdrop:'static',
                controller: 'windowMessageController',
                resolve: {
                    data: function() {
                        var msgData = new Object();
                        msgData.message = vm.validErrorMessage;
                        return msgData;
                    }
                }
            });
        }
    };

    var _validateDelayTime = function (delayTime) {      //验证时间是否有效
        var time = parseInt(delayTime);
        if(delayTime === "" || delayTime == null){
            vm.validErrorMessage = VC.ROUTER.TEMPLATE_TIPS.NO_TIME;
            return false;
        }else if(isNaN(time)){
            vm.validErrorMessage = VC.ROUTER.TEMPLATE_TIPS.PLEASE_INPUT_TIME;
            return false;
        }else if(time < 0){
            vm.validErrorMessage = VC.ROUTER.TEMPLATE_TIPS.LIVE_BIG_TIME_NEGATIVE;
            return false;
        }else if(time > parseInt(vm.data.max_delay)){
            vm.validErrorMessage = VC.ROUTER.TEMPLATE_TIPS.LIVE_MAX_DELAY_TIPS+vm.data.max_delay+VC.ROUTER.TEMPLATE_TIPS.LIVE_MAX_DELAY_MINUTES_TIPS;
            return false;
        }else{
            return true;
        }
    };

    //中英文翻译--------------
    $scope.COURSE_DELAY = VC.ROUTER.TEMPLATE_TIPS.COURSE_DELAY;
    $scope.NEED_EXTRA_TIME = VC.ROUTER.TEMPLATE_TIPS.NEED_EXTRA_TIME;
    $scope.YES = VC.ROUTER.TEMPLATE_TIPS.YES;
    $scope.CANCEL = VC.ROUTER.TEMPLATE_TIPS.CANCEL;
    $scope.MINUTES = VC.ROUTER.TEMPLATE_TIPS.MINUTES;
    $scope.YOUR_CLASS_WILL = VC.ROUTER.TEMPLATE_TIPS.YOUR_CLASS_WILL;
    $scope.AFTER_END = VC.ROUTER.TEMPLATE_TIPS.AFTER_END;
    $scope.OVERTIME = VC.ROUTER.TEMPLATE_TIPS.OVERTIME;
    $scope.MAX = VC.ROUTER.TEMPLATE_TIPS.MAX;
    $scope.MAX_MINUTES = VC.ROUTER.TEMPLATE_TIPS.MAX_MINUTES;
}]);