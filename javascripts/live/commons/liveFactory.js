classRoomModule.factory('liveFactory',['$http','$q',function($http,$q){
    return {
        get:function(url){
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: url
            }).
                success(function(data, status, headers, config) {
                    deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
                }).
                error(function(data, status, headers, config) {
                    deferred.reject(data);   // 声明执行失败，即服务器返回错误
                });
            return deferred.promise;// 返回承诺，这里并不是最终数据，而是访问最终数据的API
        }
    }
}]);