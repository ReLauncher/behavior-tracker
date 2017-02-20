var EDA_LOGGER = EDA_LOGGER || (function() {
    var settings = {
            session: Math.floor(Math.random() * 1000000) + 1,
            activity_interval: 2000,
            debug: true,
            firebase: {
                bucket: "IMAGE-TAGGING-APP"
            }
        }
        // A log function which can be easily turned of using debug variable
    var log = function(message) {
        if (settings.debug) console.log("[EDA_LOGGER] LOG: " + message);
    };
    function fullPath(el){
        var names = [];
        while (el.parentNode){
            if (el.id){
                names.unshift('#'+el.id);
                break;
            }else{
                if (el==el.ownerDocument.documentElement) 
                    names.unshift(el.tagName);
                else{
                    for (var c=1,e=el;e.previousElementSibling;e=e.previousElementSibling,c++);
                        names.unshift(el.tagName+":nth-child("+c+")");
                }
                el=el.parentNode;
            }
        }
        return names.join(" > ");
    }
    function isPageHidden() {
        return document.hidden || document.msHidden || document.webkitHidden || document.mozHidden;
    }
    function getSelectedText() {
        var text = "";
        if (typeof window.getSelection != "undefined") {
            text = window.getSelection().toString();
        } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
            text = document.selection.createRange().text;
        }
        return text;
    }
    var _args = {
        key_name: "test_name",
        key_value: "test_value"
    }; // private
    return {
        init: function(Args) {
            _args = Args;
            _args['task_id'] = parseInt(document.getElementById("assignment-job-id").innerHTML);
            _args['worker_id'] = parseInt(document.getElementById("assignment-worker-id").innerHTML);
            // Include Firebase library
            var logger = this;
            logger.init_firebase(function() {
                logger.init_events_capturing();
                logger.init_activity_capturing();
            });
        },
        init_firebase: function(callback) {
            var firebase_script = document.createElement('script');
            firebase_script.src = "https://cdn.firebase.com/js/client/2.2.9/firebase.js";

            log(firebase_script.src);

            document.getElementsByTagName('head')[0].appendChild(firebase_script);
            var logger = this;
            firebase_script.onload = function() {
                // get the assignment code from the url
                var assignment_code = document.location.pathname.substring(document.location.pathname.lastIndexOf("/"), document.location.pathname.length);
                log(assignment_code);
                // get the platform code from the url
                var platform_code = document.location.hostname.replace(/\./g, '');
                // form the firebase endpoint url
                var firebase_endpoint_url = "https://" + settings.firebase.bucket + ".firebaseio.com/" + platform_code + "/" + _args["task_id"] + "/units/" + _args['key_value'] + "/assignments" + assignment_code;
                log(firebase_endpoint_url);
                _args["firebase_assignment"] = new Firebase(firebase_endpoint_url);
                /*_args["firebase_assignment"].update({
                    key_name: _args.key_name,
                    key_value: _args.key_value,
                    unit_id: _args.key_value
                });*/
                _args["firebase_logs"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/tab_visibilty");
                _args["firebase_activity"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/page_activity");
                _args["firebase_keys"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/key_pressed");
                _args["firebase_clicks"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/clicks");

                callback();
            };
        },
        init_activity_capturing: function() {
            var logger = this;
            var activity_statuses = {
                "keyboard": 0,
                "mouse": 0,
                "scroll": 0,
                "scroll_top":0,
                "text_selected":0
            };
            setInterval(function() {
                logger.log_event(_args["firebase_activity"], (function(a) {
                    activity_statuses = {
                        "keyboard": 0,
                        "mouse": 0,
                        "scroll": 0,
                        "scroll_top":0,
                        "text_selected":0
                    };
                    return a;
                }(activity_statuses)));
            }, settings.activity_interval);

            document.onkeydown = function(evt) {
                activity_statuses["keyboard"] = 1;
            };
            document.onmouseup = function(evt){
                if (getSelectedText() != "")
                    activity_statuses["text_selected"] = 1;
            }
            document.onmousemove = function(evt) {
                activity_statuses["mouse"] = 1;
            };

            window.onscroll = function(evt) {
                activity_statuses["scroll"] = 1;
                activity_statuses["scroll_top"] = document.body.scrollTop;
            };

            document.onkeydown = function(evt) {
                var key = evt.keyCode || evt.charCode;
                logger.log_event(_args["firebase_keys"],{"key":key});
            };
            document.onmousedown = function(evt) {
                var element_path = fullPath(evt.path[0]);
                logger.log_event(_args["firebase_clicks"],{"element":element_path});
            };
        },
        init_events_capturing: function() {
            var logger = this;
            // Log the task was opened by the worker
            logger.log_event(_args["firebase_logs"], {
                status: "opened"
            });
            // Log the task page was closed by the worker
            window.onbeforeunload = function() {
                logger.log_event(_args["firebase_logs"], {
                    status: "closed"
                });
            };
            logger.init_visibility_changes();
        },
        init_visibility_changes: function() {
            var hidden, visibilityChange;
            if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
                hidden = "hidden";
                visibilityChange = "visibilitychange";
            } else if (typeof document.mozHidden !== "undefined") {
                hidden = "mozHidden";
                visibilityChange = "mozvisibilitychange";
            } else if (typeof document.msHidden !== "undefined") {
                hidden = "msHidden";
                visibilityChange = "msvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                hidden = "webkitHidden";
                visibilityChange = "webkitvisibilitychange";
            }
            var logger = this;

            function handleVisibilityChange() {
                if (document[hidden]) {
                    logger.log_event(_args["firebase_logs"], {
                        status: "hidden"
                    });
                } else {
                    logger.log_event(_args["firebase_logs"], {
                        status: "active"
                    });
                }
            }
            // Warn if the browser doesn't support addEventListener or the Page Visibility API
            if (typeof document.addEventListener === "undefined" ||
                typeof document[hidden] === "undefined") {
                //alert("This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
            } else {
                // Handle page visibility change   
                document.addEventListener(visibilityChange, handleVisibilityChange, false);
            }
        },
        log_event: function(firebase_reference, data) {
            data['dt'] = Firebase.ServerValue.TIMESTAMP;
            firebase_reference.push(data);
        }
    };
}());
