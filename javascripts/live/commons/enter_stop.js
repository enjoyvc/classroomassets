var app = angular.module('app',['ui.bootstrap']);

app.controller('stopController',['$scope','$log','$modal',function($scope,$log,$modal){
    var vm = $scope.vm = {};

    vm.message = "";

    var _alertWindow = function(msg){
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        var modalInstance = $modal.open({
            templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.STOPENTERCLASSROOM,
            backdrop:'static',
            controller: 'stopMessageController',
            resolve: {
                data: function() {
                    var data = new Object();
                    data.message = msg;
                    return data;
                }
            }
        });
    };

    vm.enterStop = function(){
        vm.message = $('#message').val();
        $log.log(vm.message);
        if(vm.message == null || vm.message === "")
            return;
        _alertWindow(vm.message);
    };
    vm.enterStop();


}]);

app.controller('stopMessageController',['$scope','$log','data','$modal','$modalInstance',
    function($scope,$log,data,$modal,$modalInstance){

        var vm = $scope.vm = {};
        vm.message = data.message;

        vm.sure = function(){
            var protocol = document.location.protocol;
            var hostName = window.location.host;
            window.location.href = protocol + '//' + hostName + '/myvc';
        };


        $scope.NOTICE = VC.ROUTER.TEMPLATE_TIPS.NOTICE;
        $scope.YES = VC.ROUTER.TEMPLATE_TIPS.YES;

}]);

