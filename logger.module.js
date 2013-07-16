// Logging facility. Depends on SignalR
// saves logs to the server in either or all of the three cases:
// 1) time limit reached;
// 2) log size limit reached;
// 3) application is being disposed of;

angular.module("infrastructure.LoggerModule", ["dataAccess.SignalRModule"])
.value("$loggerConfig", 
{
    // when the log queue should be saved
    TIMEOUT_VALUE: 5000,
    // determines how many log messages should be kept in memory
    SIZE_LIMIT: 100
})
.factory("loggerService", ["$loggerConfig", "hubFactory", function ($loggerConfig, hubFactory) {
    "use strict";

    var arLogs = [];

    // on app close save log data
    //scope.$on("event:appClosed", _pushLogData);
    //time limit reached;
    if ($loggerConfig.TIMEOUT_VALUE) {
        window.setInterval(function() {
            _pushLogData();
        }, $loggerConfig.TIMEOUT_VALUE);
    }
    
    // #region Functions
    function _writeLog(logRequest) {
        // Check whether the log size limit is reached. If yes - save the logs first to a persistence medium.;
        if ($loggerConfig.SIZE_LIMIT && arLogs.length > $loggerConfig.SIZE_LIMIT) {
            _pushLogData();
        }
        arLogs.push({
            type: logRequest.type,
            message: logRequest.message,
            time: new Date()
        });
    }
        
    // sends logs to the server
    function _pushLogData() {
        if (arLogs.length === 0) {
            return;
        }
        var arLogsTmp = arLogs;
        arLogs = [];
        
        hubFactory.hub("loggerHub").run("write", arLogsTmp);
    }
    
    function writeError(errorMessage) {
        _writeLog({ type: "error", message: errorMessage });
        return this;
    }
        
    function writeWarning(warningMessage) {
        _writeLog({ type: "warning", message: warningMessage });
        return this;
    }

    function writeInfo(infoMessage) {
        _writeLog({ type: "info", message: infoMessage });
        return this;
    }
    
    function writeDebug(infoMessage) {
        _writeLog({ type: "debug", message: infoMessage });
        return this;
    }

    // #endregion 

    return {
        writeError: writeError,
        writeWarning: writeWarning,
        writeInfo: writeInfo,
        writeDebug: writeDebug
    };
}]);
