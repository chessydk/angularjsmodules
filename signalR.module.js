/*
*   AngularJs module simplifying the work with SignalR hub proxies. No need to explicitly start the connection to a hub. 
*   Requires angular.js
*   @example: hubFactory.hub("myHub").run("myMethod", param_1, param_2, .... param_n).then ( function(responseData) {} )
*/
angular.module("dataAccess.SignalRModule", []).factory("hubFactory", ["$q", "$rootScope", function ($q, $rootScope) {
    "use strict";

    // log signalR client-side messages
    $.connection.hub.logging = true;
    //$.signalR.prototype.disconnectTimeout = 100000;

    function init() {
        //$.connection.hub.stateChanged(function (state) {
            // Transitioning from connecting to connected
            //if (state.oldState === $.signalR.connectionState.connecting && state.newState === $.signalR.connectionState.connected) {
            //if(state.newState === $.signalR.connectionState.disconnected){
            //    $.connection.hub.start();
            //}
        //});

        return $.connection.hub.start();
    };

    /**
    * Hub constructor.
    *
    * @class Hub
    * @constructor
    * @param {String} SignalR hub name
    */
    function Hub(strHubName) {
        if (!strHubName) {
            throw new Error("Hub name not defined!");
        }

        this.hub = $.connection[strHubName];

        if (this.hub === undefined) {
            throw new Error("Hub with name " + strHubName + " doesn't exist.");
        }
    }

    /**
    * Runs a method on the SignalR hub proxy asynchronously.
    *
    * @method run
    * @param {String} proxy method name
    * @return {Promise} Returns promise
    */
    Hub.prototype.run = function (methodName) {
        var self = this;
        var args = arguments;
        var def = $q.defer();

        if (!$.connection.hub) def.reject("Hub not available.");

        // calls the hub method and resolves the promise
        function _resolveMethodCall() {
            
            try {                
                var response = self.hub.invoke.apply(self.hub, args);

                if (!$rootScope.$$phase) {
                    $rootScope.$apply(function () {
                        def.resolve(response);
                    });
                }
                else {
                    def.resolve(response);
                }
            }
            catch (err) {
                if (!$rootScope.$$phase) {
                    $rootScope.$apply(function () {
                        def.reject(err);
                    });
                }
                else {
                    def.reject(err);
                }
            }
        }

        switch ($.connection.hub.state) {
            case $.signalR.connectionState.connected:
                _resolveMethodCall();
                break;
            case $.signalR.connectionState.disconnected:
                init().done(function () {
                    _resolveMethodCall();
                }).fail(function (err) {
                    if (!$rootScope.$$phase) {
                        $rootScope.$apply(function () {
                            def.reject(err);
                        });
                    }
                    else {
                        def.reject(err);
                    }
                });
                break;
            case $.signalR.connectionState.connecting:
            case $.signalR.connectionState.reconnecting:
            default:
                $.connection.hub.stateChanged(function (state) {
                    if (state.newState === $.signalR.connectionState.connected)
                        _resolveMethodCall();
                });
                break;

        }

        return def.promise;
    }
    // returns an Object containing a method that returns a required SignalR hub
    return {
        getHub: function (hubName) {
            return new Hub(hubName);
        }
    };
}]);
