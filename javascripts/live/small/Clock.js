
classRoomModule.controller('ClockController', ['$scope','$modal',function($scope,$modal){

    $scope.courseTitle = null;          //课程标题
    $scope.$on('setCourseTitle',function(evt, args){
        $scope.courseTitle = args;
    });

    $scope.delayShow = true;            //申请延时
    $scope.$on('setDelayShow',function(evt, args){
        $scope.delayShow = args;
    });

    $scope.endClassroom = function(){           //结束课堂
        var protocol = document.location.protocol;
        var hostName = window.location.host;
        var modalInstance = $modal.open({
            templateUrl: protocol + '//' + hostName+VC.ROUTER.TEMPLATE.ENDCLASSROOM,
            backdrop:'static',
            controller: 'windowMessageController',
            resolve: {
                data: function() {
                    var data = new Object();
                    data.message = VC.ROUTER.LIVEBIG.SURE_TO_EXIT;
                    return data;
                }
            }
        });
        modalInstance.result.then(function(result) {
            if(result == "sure_end"){
                //alert("退出课室成功");
                $scope.$emit('user_leave',null);
            }
        });
    };
    $scope.coursewareObj = {
        documentindex:null,
        total:null,
        showSchedule:false,
        schedule:'0%',
        errorcount:0
    };
    /*Javascript设置要保留的小数位数，四舍五入。
  　　*ForDight(Dight,How):数值格式化函数，Dight要格式化的 数字，How要保留的小数位数。
  　　*这里的方法是先乘以10的倍数，然后去掉小数，最后再除以10的倍数。
  　　*/
    var ForDight = function(Dight,How){ 
    　　　　Dight = Math.round(Dight*Math.pow(10,How))/Math.pow(10,How); 
    　　　　return Dight; 
    　  }; 
    $scope.$on('coursewareTransformation',function(evt,args){
        $scope.coursewareObj.showSchedule = true;
        $scope.coursewareObj.documentindex = args.documentindex;
        $scope.coursewareObj.total = args.total;
        $scope.coursewareObj.errorcount = args.errorcount;
        $scope.coursewareObj.schedule = ForDight(($scope.coursewareObj.documentindex / $scope.coursewareObj.total),2)*100 + '%';
        if($scope.coursewareObj.documentindex == $scope.coursewareObj.total){
            $scope.coursewareObj.showSchedule = false;
        }
    });
    $scope.$on('coursewareshow',function(evt,args){
        $scope.coursewareObj.showSchedule = args.status;
        $scope.coursewareObj.documentindex = args.documentindex;
        $scope.coursewareObj.total = args.total;
        $scope.coursewareObj.errorcount = args.errorcount;
        $scope.coursewareObj.schedule = ForDight(($scope.coursewareObj.documentindex / $scope.coursewareObj.total),2)*100 + '%';
        if($scope.coursewareObj.documentindex == $scope.coursewareObj.total){
            $scope.coursewareObj.showSchedule = false;
        }
    });

    $scope.timeObj = {
        delayRemind:false
    };
    $scope.$on('delayRemind', function (evt, arg) {
        $scope.timeObj.delayRemind = arg;
    });
	$scope.classPeriod = {
			hour:0,
			minute:0,
			second:0
	};
    $scope.role = angular.element("#role").val();
	var duration = 0;	//  课堂开始的的累计时间，单位是秒
	var baseTime;  
	var differenceSer = 0;
	var difforiginalSer = 0; 
	var calculate = function(){
		var stime = angular.element("#stime").val();
		var etime = angular.element("#etime").val();
		var sertime =  angular.element("#sertime").val();
		var nowtime =  angular.element("#nowtime").val();
		
		if(!strIsEmpty(sertime) && !strIsEmpty(nowtime)){ 
			baseTime  =  sertime - nowtime; 
			var diff = +new Date - parseInt(nowtime);    
			if( Math.abs( diff ) - 10000 > 10000 ){       
				baseTime = sertime -  $.now();   
			} 
		} 
		
		differenceSer = parseInt(nowtime) + parseInt(baseTime) - parseInt(stime);
		if(!strIsEmpty(nowtime) && !strIsEmpty(baseTime) && !strIsEmpty(sertime) && !strIsEmpty(stime)){ 
			   if(differenceSer - difforiginalSer > 45000){
				   difforiginalSer = parseInt(nowtime) + parseInt(baseTime) - parseInt(stime);   
				   duration = 0 + parseInt(Math.round(differenceSer/1000));
			   }	
		}
		
		if(differenceSer > 45000){
			duration = duration + 1;
			$scope.$apply(function(scope){ 	
			    scope.classPeriod.hour = parseInt(duration / 3600,10);
				scope.classPeriod.minute = parseInt(duration / 60 % 60,10);
				scope.classPeriod.second = parseInt(duration % 60,10);
			});
		}
	};
	
	var strIsEmpty = function(str){  
	    return str == null || !str || typeof str == undefined || str == '';  
	};

	setInterval(calculate , 1000); 

}]);