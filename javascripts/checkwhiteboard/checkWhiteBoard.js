angular.module('WhiteBoard',[])
	.constant('URL', '/whiteboard/showlog')
	.factory('msgFactory', function(){
		return {
			show:function(msg){
				alert(msg);
			}
		}
	})
	.controller('checkWhiteBoard',function($scope,$http,$log, URL, msgFactory){
		$scope.query = function(){
			var roomid = $scope.roomid;
			var userid = $scope.userid;
			$http({
					method:'GET',
					url: URL,
					params:{roomid:roomid,userid:userid}
			})
			.success(function(data){
					msgFactory.show(data);
					$scope.whiteboarddatas = data;
				}
			);
		}
	});

