/**
 * Created by Administrator on 2014/12/8.
 */

classRoomModule.controller('errorMessageController',['$scope','$timeout','data','$modal','$modalInstance',function($scope,$timeout,data,$modal,$modalInstance){

    var vm = $scope.vm = {};
    vm.data = data;
    vm.message = data.message;

    vm.closeWindow = function(){        //关闭浏览器
        /*window.open('', '_self', '');
        window.close();*/
        if(typeof(globalUI) != "undefined") {
            window.location.reload();
            return;
        }
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        //David edit
        //window.location.href = protocol + '//' + hostName + '/myvc';
        //window.location.href = protocol + '//' + hostName + '/app/camp/cn/schedule.html';        
        window.location.href = $('#vcliveHost').val() + '/app/camp/' + VC.ROUTER.LIVEBIG.PUBLIC_KEY + '/schedule.html';
        //window.history.go(-2);
    };

//    $timeout(function(){
//        vm.closeWindow();
//    },3000);

    //中英文翻译--------------------
    $scope.NOTICE = VC.ROUTER.TEMPLATE_TIPS.NOTICE;
    $scope.YES = VC.ROUTER.TEMPLATE_TIPS.YES;

}]);