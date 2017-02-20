var BT = BT || (function() {
    var settings = {
            session: Math.floor(Math.random() * 1000000) + 1,
            debug: false
        }
        // A log function which can be easily turned of using debug variable
    var log = function(message) {
        if (settings.debug) console.log("[BT] LOG: " + message);
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
        firebase_bucket: "IMAGE-TAGGING-APP",
        page_id:"page_id_undefined",
        unit_id:"unit_id_undefined",
        user_id:"user_id_undefined",
        
    }; // private
    return {
        init: function(Args) {
            _args = Object.assign(_args, Args);
            var logger = this;
            logger.init_firebase(function() {
                logger.init_events_capturing();
                logger.init_activity_capturing();
            });
        },
        init_firebase: function(callback) {
            var firebase_script = document.createElement('script');
            firebase_script.src = "https://cdn.firebase.com/js/client/2.2.9/firebase.js";
            document.getElementsByTagName('head')[0].appendChild(firebase_script);
            var logger = this;
            firebase_script.onload = function() {
                // get the assignment code from the url
                var assignment_code = document.location.pathname.substring(document.location.pathname.lastIndexOf("/"), document.location.pathname.length);
                log(assignment_code);
                // get the platform code from the url
                var platform_code = document.location.hostname.replace(/\./g, '');
                // form the firebase endpoint url
                var firebase_endpoint_url = "https://" + _args["firebase_bucket"] + ".firebaseio.com/" + platform_code + "/" + _args["page_id"] + "/units/" + _args['unit_id'] + "/users/" + _args['user_id'];
                log(firebase_endpoint_url);
                _args["firebase_assignment"] = new Firebase(firebase_endpoint_url);

                _args["firebase_logs"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/tab_visibilty");
                _args["firebase_activity"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/page_activity");
                _args["firebase_keys"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/key_pressed");
                _args["firebase_clicks"] = _args["firebase_assignment"].child('sessions/' + settings.session + "/clicks");

                callback();
            };
        },
        init_activity_capturing: function() {
            var logger = this;
            
            document.onkeydown = function(evt) {
                var key = evt.keyCode || evt.charCode;
                logger.log_event(_args["firebase_keys"],{"key":key});
            };
            document.onmousedown = function(evt) {
                var element_path = fullPath(evt.target);
                logger.log_event(_args["firebase_clicks"],{"element":element_path});
            };
        },
        init_events_capturing: function() {
            var logger = this;
            // Log the page was opened by the user
            logger.log_event(_args["firebase_logs"], {
                status: "opened"
            });
            // Log the page was closed by the user
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
