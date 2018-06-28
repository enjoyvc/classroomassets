var app = angular.module('errorApp',[]);

app.controller('errorController',['$scope','$log',function($scope,$log){
	
	$scope.closeWindow = function(){
		$('#errorTips').modal({opacity:100,overlayCss: {backgroundColor:"#000000"},position:["40%",]});
		setTimeout(function(){
            window.open('', '_self', '');
            window.close();
        },1000*30);
	};
	$scope.closeWindow();
	
	$scope.close = function(){
		window.open('', '_self', '');
        window.close();
	};
	
	
}]);