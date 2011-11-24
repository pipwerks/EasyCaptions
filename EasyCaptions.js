/*-------------------------------------------------------------------- 
EasyCaptions v0.1.20111123
https://github.com/pipwerks/EasyCaptions
Copyright (c) Philip Hutchison
MIT-style license: http://pipwerks.mit-license.org/
--------------------------------------------------------------------*/

var EasyCaptions = function (options){
        
    /* Declare all variables */
	
	//Strings stored as vars for better minification/compression
	var UNDEFINED = "undefined",
		STRING = "string",
		FUNCTION = "function",
		SPACE = "&nbsp;",
		MAYBE = "maybe",
		PROBABLY = "probably",
		TYPE = "type",
		SPAN = "span",
		DATABEGIN = "data-begin",
		DATAEND = "data-end",
		TRUE = true,
		FALSE = false,
		
		$id = function (id){ return document.getElementById(id); },
		enable_transcript = (typeof options.enableTranscript !== UNDEFINED) ? options.enableTranscript : TRUE,
		enable_captions = (typeof options.enableCaptions !== UNDEFINED) ? options.enableCaptions : TRUE,
		//Determine if HTML element was passed as argument or element's ID (string)
		//If string, get it using $id (internal shortcut for document.getElementById)			
		transcript_element = (typeof options.transcriptElementID === STRING) ? $id(options.transcriptElementID) : options.transcriptElementID || FALSE,
		video_element =  (typeof options.videoElementID === STRING) ? $id(options.videoElementID) : options.videoElementID || FALSE,
		//The class to append to the transcript text container.
		//If no custom class provided by user, use default
		transcript_enabled_class = options.transcriptEnabledClass || "EasyCaptions-enabled",
		//The ID to append to the generated caption area. If no custom ID provided by user, use default
		caption_id = options.captionID || "EasyCaptions-caption",
		caption_array = [],
		caption_element,
		html5_supported,

		
		//Internal functions
		isHtml5VideoSupported = function (){
			
			var isSupported = FALSE,
				video = video_element || FALSE,
				video_element_type = (video && video.getAttribute(TYPE) !== UNDEFINED) ? video.getAttribute(TYPE) : FALSE,
				canplay = (typeof video.canPlayType !== UNDEFINED);
				
			if(!video){ return FALSE; }
				
			if(video_element_type){
				
				canplay = video.canPlayType(video_element_type);
				isSupported = video_element_type && (canplay === MAYBE || canplay === PROBABLY);
				
			} else {
				
				if(canplay){
					
					var src = video.getElementsByTagName("source");
					for (var i=0; i < src.length; i++){
						canplay = video.canPlayType(src[i].getAttribute(TYPE));
						if(canplay === MAYBE || canplay === PROBABLY){
							isSupported = TRUE;
							break;
						}
					}
					
				}
				
			}
				
			return isSupported;
			
		},
		
	
		//Copies text stored in caption array
		updateCaption = function (timecode){
			if(typeof caption_array[timecode] !== UNDEFINED){
				caption_element.innerHTML = caption_array[timecode];
			}
		},

		//For HTML5 captions
		timeupdateHandler = function () { updateCaption(parseInt(this.currentTime, 10)); },
		
		//Create page element for displaying caption text
		createCaptionField = function (video_element, caption_id){
			var caption = $id(caption_id);
			if(!caption && typeof video_element !== UNDEFINED){
				caption = document.createElement("div");
				caption.id = caption_id;
				caption.innerHTML = SPACE;
				video_element.parentNode.appendChild(caption);
			}
			return caption;
		},
	
	
		//Get all caption text, store in array
		getSpans = function (transcript_el){
			
			if(!transcript_el){ return FALSE; }
			
			var spans = transcript_el.getElementsByTagName(SPAN),
				captionArray = [];
				
			for(var i=0, count = spans.length; i < count; i++){
				var beginNum = spans[i].getAttribute(DATABEGIN);
				var endNum = spans[i].getAttribute(DATAEND);
				captionArray[beginNum] = spans[i].innerHTML;
				captionArray[endNum] = SPACE;
			}
		
			return captionArray;
			
		},
			
			
		//Provide ability to create interactive transcripts
		enableTranscript = function (custom_handler, alt_video_element){
						
			//Ensure one of the approaches will work before continuing
			if(!html5_supported && typeof custom_handler !== FUNCTION){ return FALSE; }
			
			//Append classname to transcript text container. 
			//This allows developers to turn on CSS styling for hover state
			if(transcript_element.className.indexOf(transcript_enabled_class) === -1){
				transcript_element.className = transcript_element.className + " " +transcript_enabled_class;
			}

			//Using event delegation to make *transcript_element* clickable instead of individual spans
			transcript_element.onclick = function (e){
	
				var event = e || window.event,
					target = event.target || event.srcElement,
					position;
				
				if (target.nodeName.toLowerCase() === SPAN) {
					
					position = target.getAttribute(DATABEGIN);
					
					if(typeof position === UNDEFINED){ return FALSE; }
		
					//Browser supports HTML5 video. Use HTML5 currentTime method.
					if(html5_supported && video_element){ video_element.currentTime = position; }
					
					//Invoke user's specified video handler.
					if(!html5_supported && alt_video_element && custom_handler){ custom_handler(alt_video_element, position); }
				
				}
				
			};
		
		},

		
		enableCaptions = function (custom_handler, alt_video_element){
	
			//Ensure one of the approaches will work before continuing
			if(!html5_supported && typeof custom_handler !== FUNCTION){ return FALSE; }
						
			//Get all caption_array text, store in array
			if(caption_array.length === 0){ caption_array = getSpans(transcript_element); }
			
			//Create page element for displaying caption text
			if(!caption_element){
				var target = (!html5_supported && alt_video_element) ? alt_video_element : video_element;
				caption_element = createCaptionField(target, caption_id);
			}
		
			//Set up HTML5 listener
			if(html5_supported){ video_element.addEventListener("timeupdate", timeupdateHandler, FALSE); }
			
			//Invoke user's specified video handler.
			if(!html5_supported && alt_video_element && custom_handler){ custom_handler(alt_video_element, updateCaption); }

		},
		
		enableFallback = function (params){
						
			var caption_handler = (typeof params.captionHandler === FUNCTION) ? params.captionHandler : FALSE,
				transcript_handler = (typeof params.transcriptHandler === FUNCTION) ? params.transcriptHandler : FALSE,
				//Check to see if ID or DOM element was passed as argument
				alt_video_element = (typeof params.elementID === UNDEFINED) ? FALSE : (typeof params.elementID === STRING) ? $id(params.elementID) : params.elementID;
			
			//Ensure we have something to work with before continuing
			if(!alt_video_element || (!caption_handler && !transcript_handler)){ return FALSE; }

			if(caption_handler){ enableCaptions(caption_handler, alt_video_element); }
			if(transcript_handler){ enableTranscript(transcript_handler, alt_video_element); }
			
		};

		
	//Check for user-defined settings. Set defaults where appropriate.
	
	
	//Detect if HTML5 video is supported
	html5_supported = isHtml5VideoSupported();
		
	//Enable transcript
	if(enable_transcript){ enableTranscript(); }
	
	//Enable captions
	if(enable_captions){ enableCaptions(); }

	/* Public API */
	this.video = video_element;
	this.transcript_element = transcript_element;
	this.caption_element = caption_element;
	this.updateCaption = updateCaption;
	this.html5_supported = html5_supported;
	this.addFallback = enableFallback;
	
    return this;
    
};
