classRoomModule.controller('windowMessageController',['$scope','$window','data','$modal','$modalInstance',function($scope,$window,data,$modal,$modalInstance){

    var vm = $scope.vm = {};
    vm.data = data;
    vm.message = data.message;

    vm.sureEnd = function(){        //结束课堂
        $modalInstance.close('sure_end');
    };

    vm.closeWindow = function(){        //关闭浏览器
       /* $window.open('', '_self', '');
        $window.close();*/
        window.location.href = 'about:blank';
    };


    //中英文翻译--------------------
    $scope.NOTICE = VC.ROUTER.TEMPLATE_TIPS.NOTICE;
    $scope.YES = VC.ROUTER.TEMPLATE_TIPS.YES;

}]);