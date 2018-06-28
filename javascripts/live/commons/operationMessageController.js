classRoomModule.controller('operationMessageController',['$scope','data','$modal','$modalInstance',
    function($scope,data,$modal,$modalInstance){

        var vm = $scope.vm = {};
        vm.data = data;

        vm.sure = function(){       //确定
            $modalInstance.close(true);
        };





        //中英文翻译--------------------
        $scope.NOTICE = VC.ROUTER.TEMPLATE_TIPS.NOTICE;
        $scope.YES = VC.ROUTER.TEMPLATE_TIPS.YES;
}]);


