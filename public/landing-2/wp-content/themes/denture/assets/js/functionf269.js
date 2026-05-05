(function ($) {
    "use strict";
	
	var $window = $(window); 
	var $body = $('body'); 
	
	/* Slick library JS */
	  var
        defaults = {
            label: 'MENU',
            duplicate: true,
            duration: 200,
            easingOpen: 'swing',
            easingClose: 'swing',
            closedSymbol: '&#9658;',
            openedSymbol: '&#9660;',
            prependTo: 'body',
            appendTo: '',
            parentTag: 'a',
            closeOnClick: false,
            allowParentLinks: false,
            nestedParentLinks: true,
            showChildren: false,
            removeIds: true,
            removeClasses: false,
            removeStyles: false,
			brand: '',
            animations: 'jquery',
            init: function () {},
            beforeOpen: function () {},
            beforeClose: function () {},
            afterOpen: function () {},
            afterClose: function () {}
        },
        mobileMenu = 'slicknav',
        prefix = 'slicknav',
        Keyboard = {
            DOWN: 40,
            ENTER: 13,
            ESCAPE: 27,
            LEFT: 37,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38,
        };

    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);

        // Don't remove IDs by default if duplicate is false
        if (!this.settings.duplicate && !options.hasOwnProperty("removeIds")) {
          this.settings.removeIds = false;
        }

        this._defaults = defaults;
        this._name = mobileMenu;

        this.init();
    }

    Plugin.prototype.init = function () {
        var $this = this,
            menu = $(this.element),
            settings = this.settings,
            iconClass,
            menuBar;

        // clone menu if needed
        if (settings.duplicate) {
            $this.mobileNav = menu.clone();
        } else {
            $this.mobileNav = menu;
        }

        // remove IDs if set
        if (settings.removeIds) {
          $this.mobileNav.removeAttr('id');
          $this.mobileNav.find('*').each(function (i, e) {
              $(e).removeAttr('id');
          });
        }

        // remove classes if set
        if (settings.removeClasses) {
            $this.mobileNav.removeAttr('class');
            $this.mobileNav.find('*').each(function (i, e) {
                $(e).removeAttr('class');
            });
        }

        // remove styles if set
        if (settings.removeStyles) {
            $this.mobileNav.removeAttr('style');
            $this.mobileNav.find('*').each(function (i, e) {
                $(e).removeAttr('style');
            });
        }

        // styling class for the button
        iconClass = prefix + '_icon';

        if (settings.label === '') {
            iconClass += ' ' + prefix + '_no-text';
        }

        if (settings.parentTag === 'a') {
            settings.parentTag = 'a href="#"';
        }

        // create menu bar
        $this.mobileNav.attr('class', prefix + '_nav');
        menuBar = $('<div class="' + prefix + '_menu"></div>');
		if (settings.brand !== '') {
			var brand = $('<div class="' + prefix + '_brand">'+settings.brand+'</div>');
			$(menuBar).append(brand);
		}
        $this.btn = $(
            ['<' + settings.parentTag + ' aria-haspopup="true" role="button" tabindex="0" class="' + prefix + '_btn ' + prefix + '_collapsed">',
                '<span class="' + prefix + '_menutxt">' + settings.label + '</span>',
                '<span class="' + iconClass + '">',
                    '<span class="' + prefix + '_icon-bar"></span>',
                    '<span class="' + prefix + '_icon-bar"></span>',
                    '<span class="' + prefix + '_icon-bar"></span>',
                '</span>',
            '</' + settings.parentTag + '>'
            ].join('')
        );
        $('.navbar-toggle').append($this.btn);
        if(settings.appendTo !== '') {
            $(settings.appendTo).append(menuBar);
        } else {
            $(settings.prependTo).prepend(menuBar);
        }
        menuBar.append($this.mobileNav);

        // iterate over structure adding additional structure
        var items = $this.mobileNav.find('li');
        $(items).each(function () {
            var item = $(this),
                data = {};
            data.children = item.children('ul').attr('role', 'menu');
            item.data('menu', data);

            // if a list item has a nested menu
            if (data.children.length > 0) {

                // select all text before the child menu
                // check for anchors

                var a = item.contents(),
                    containsAnchor = false,
                    nodes = [];

                $(a).each(function () {
                    if (!$(this).is('ul')) {
                        nodes.push(this);
                    } else {
                        return false;
                    }

                    if($(this).is("a")) {
                        containsAnchor = true;
                    }
                });

                var wrapElement = $(
                    '<' + settings.parentTag + ' role="menuitem" aria-haspopup="true" tabindex="-1" class="' + prefix + '_item"/>'
                );

                // wrap item text with tag and add classes unless we are separating parent links
                if ((!settings.allowParentLinks || settings.nestedParentLinks) || !containsAnchor) {
                    var $wrap = $(nodes).wrapAll(wrapElement).parent();
                    $wrap.addClass(prefix+'_row');
                } else
                    $(nodes).wrapAll('<span class="'+prefix+'_parent-link '+prefix+'_row"/>').parent();

                if (!settings.showChildren) {
                    item.addClass(prefix+'_collapsed');
                } else {
                    item.addClass(prefix+'_open');
                }

                item.addClass(prefix+'_parent');

                // create parent arrow. wrap with link if parent links and separating
                var arrowElement = $('<span class="'+prefix+'_arrow">'+(settings.showChildren?settings.openedSymbol:settings.closedSymbol)+'</span>');

                if (settings.allowParentLinks && !settings.nestedParentLinks && containsAnchor)
                    arrowElement = arrowElement.wrap(wrapElement).parent();

                //append arrow
                $(nodes).last().after(arrowElement);


            } else if ( item.children().length === 0) {
                 item.addClass(prefix+'_txtnode');
            }

            // accessibility for links
			item.children('a').attr('role', 'menuitem').on("click", function(event){
                //Ensure that it's not a parent
                if (settings.closeOnClick && !$(event.target).parent().closest('li').hasClass(prefix+'_parent')) {
                        //Emulate menu close if set
                        $($this.btn).trigger('click');
                    }
            });

            //also close on click if parent links are set
            if (settings.closeOnClick && settings.allowParentLinks) {
				
				item.children('a').children('a').on("click", function(event){
                    //Emulate menu close
                    $($this.btn).trigger('click');
                });

				item.find('.'+prefix+'_parent-link a:not(.'+prefix+'_item)').on("click", function(event){
                    //Emulate menu close
                        $($this.btn).trigger('click');
                });
            }
        });

        // structure is in place, now hide appropriate items
        $(items).each(function () {
            var data = $(this).data('menu');
            if (!settings.showChildren){
                $this._visibilityToggle(data.children, null, false, null, true);
            }
        });

        // finally toggle entire menu
        $this._visibilityToggle($this.mobileNav, null, false, 'init', true);

        // accessibility for menu button
        $this.mobileNav.attr('role','menu');

        // outline prevention when using mouse
		$(document).on( "mousedown", function() {
			$this._outlines(false);
        });

		$(document).on( "keyup", function() {
            $this._outlines(true);
        });

        // menu button click
		 $($this.btn).on("click", function(e){
            e.preventDefault();
            $this._menuToggle();
        });

        // click on menu parent
        $this.mobileNav.on('click', '.' + prefix + '_item', function (e) {
            e.preventDefault();
            $this._itemClick($(this));
        });

        // check for keyboard events on menu button and menu parents
		$($this.btn).on("keydown", function(e){
            var ev = e || event;

            switch(ev.keyCode) {
                case Keyboard.ENTER:
                case Keyboard.SPACE:
                case Keyboard.DOWN:
                    e.preventDefault();
                    if (ev.keyCode !== Keyboard.DOWN || !$($this.btn).hasClass(prefix+'_open')){
                        $this._menuToggle();
                    }
                    
                    $($this.btn).next().find('[role="menuitem"]').first().trigger( "focus" );
                    break;
            }

            
        });

        $this.mobileNav.on('keydown', '.'+prefix+'_item', function(e) {
            var ev = e || event;

            switch(ev.keyCode) {
                case Keyboard.ENTER:
                    e.preventDefault();
                    $this._itemClick($(e.target));
                    break;
                case Keyboard.RIGHT:
                    e.preventDefault();
                    if ($(e.target).parent().hasClass(prefix+'_collapsed')) {
                        $this._itemClick($(e.target));
                    }
                    $(e.target).next().find('[role="menuitem"]').first().trigger( "focus" );
                    break;
            }
        });

        $this.mobileNav.on('keydown', '[role="menuitem"]', function(e) {
            var ev = e || event;

            switch(ev.keyCode){
                case Keyboard.DOWN:
                    e.preventDefault();
                    var allItems = $(e.target).parent().parent().children().children('[role="menuitem"]:visible');
                    var idx = allItems.index( e.target );
                    var nextIdx = idx + 1;
                    if (allItems.length <= nextIdx) {
                        nextIdx = 0;
                    }
                    var next = allItems.eq( nextIdx );
                    next.trigger( "focus" );
                break;
                case Keyboard.UP:
                    e.preventDefault();
                    var allItems = $(e.target).parent().parent().children().children('[role="menuitem"]:visible');
                    var idx = allItems.index( e.target );
                    var next = allItems.eq( idx - 1 );
                    next.trigger( "focus" );
                break;
                case Keyboard.LEFT:
                    e.preventDefault();
                    if ($(e.target).parent().parent().parent().hasClass(prefix+'_open')) {
                        var parent = $(e.target).parent().parent().prev();
                        parent.trigger( "focus" );
                        $this._itemClick(parent);
                    } else if ($(e.target).parent().parent().hasClass(prefix+'_nav')){
                        $this._menuToggle();
                        $($this.btn).trigger( "focus" );
                    }
                    break;
                case Keyboard.ESCAPE:
                    e.preventDefault();
                    $this._menuToggle();
                    $($this.btn).trigger( "focus" );
                    break;    
            }
        });

        // allow links clickable within parent tags if set
        if (settings.allowParentLinks && settings.nestedParentLinks) {
			 $('.'+prefix+'_item a').on("click", function(e){
                    e.stopImmediatePropagation();
            });
        }
    };

    //toggle menu
    Plugin.prototype._menuToggle = function (el) {
        var $this = this;
        var btn = $this.btn;
        var mobileNav = $this.mobileNav;

        if (btn.hasClass(prefix+'_collapsed')) {
            btn.removeClass(prefix+'_collapsed');
            btn.addClass(prefix+'_open');
        } else {
            btn.removeClass(prefix+'_open');
            btn.addClass(prefix+'_collapsed');
        }
        btn.addClass(prefix+'_animating');
        $this._visibilityToggle(mobileNav, btn.parent(), true, btn);
    };

    // toggle clicked items
    Plugin.prototype._itemClick = function (el) {
        var $this = this;
        var settings = $this.settings;
        var data = el.data('menu');
        if (!data) {
            data = {};
            data.arrow = el.children('.'+prefix+'_arrow');
            data.ul = el.next('ul');
            data.parent = el.parent();
            //Separated parent link structure
            if (data.parent.hasClass(prefix+'_parent-link')) {
                data.parent = el.parent().parent();
                data.ul = el.parent().next('ul');
            }
            el.data('menu', data);
        }
        if (data.parent.hasClass(prefix+'_collapsed')) {
            data.arrow.html(settings.openedSymbol);
            data.parent.removeClass(prefix+'_collapsed');
            data.parent.addClass(prefix+'_open');
            data.parent.addClass(prefix+'_animating');
            $this._visibilityToggle(data.ul, data.parent, true, el);
        } else {
            data.arrow.html(settings.closedSymbol);
            data.parent.addClass(prefix+'_collapsed');
            data.parent.removeClass(prefix+'_open');
            data.parent.addClass(prefix+'_animating');
            $this._visibilityToggle(data.ul, data.parent, true, el);
        }
    };

    // toggle actual visibility and accessibility tags
    Plugin.prototype._visibilityToggle = function(el, parent, animate, trigger, init) {
        var $this = this;
        var settings = $this.settings;
        var items = $this._getActionItems(el);
        var duration = 0;
        if (animate) {
            duration = settings.duration;
        }
        
        function afterOpen(trigger, parent) {
            $(trigger).removeClass(prefix+'_animating');
            $(parent).removeClass(prefix+'_animating');

            //Fire afterOpen callback
            if (!init) {
                settings.afterOpen(trigger);
            }
        }
        
        function afterClose(trigger, parent) {
            el.attr('aria-hidden','true');
            items.attr('tabindex', '-1');
            $this._setVisAttr(el, true);
            el.hide(); //jQuery 1.7 bug fix

            $(trigger).removeClass(prefix+'_animating');
            $(parent).removeClass(prefix+'_animating');

            //Fire init or afterClose callback
            if (!init){
                settings.afterClose(trigger);
            } else if (trigger === 'init'){
                settings.init();
            }
        }

        if (el.hasClass(prefix+'_hidden')) {
            el.removeClass(prefix+'_hidden');
             //Fire beforeOpen callback
            if (!init) {
                settings.beforeOpen(trigger);
            }
            if (settings.animations === 'jquery') {
                el.stop(true,true).slideDown(duration, settings.easingOpen, function(){
                    afterOpen(trigger, parent);
                });
            } else if(settings.animations === 'velocity') {
                el.velocity("finish").velocity("slideDown", {
                    duration: duration,
                    easing: settings.easingOpen,
                    complete: function() {
                        afterOpen(trigger, parent);
                    }
                });
            }
            el.attr('aria-hidden','false');
            items.attr('tabindex', '0');
            $this._setVisAttr(el, false);
        } else {
            el.addClass(prefix+'_hidden');

            //Fire init or beforeClose callback
            if (!init){
                settings.beforeClose(trigger);
            }

            if (settings.animations === 'jquery') {
                el.stop(true,true).slideUp(duration, this.settings.easingClose, function() {
                    afterClose(trigger, parent)
                });
            } else if (settings.animations === 'velocity') {
                
                el.velocity("finish").velocity("slideUp", {
                    duration: duration,
                    easing: settings.easingClose,
                    complete: function() {
                        afterClose(trigger, parent);
                    }
                });
            }
        }
    };

    // set attributes of element and children based on visibility
    Plugin.prototype._setVisAttr = function(el, hidden) {
        var $this = this;

        // select all parents that aren't hidden
        var nonHidden = el.children('li').children('ul').not('.'+prefix+'_hidden');

        // iterate over all items setting appropriate tags
        if (!hidden) {
            nonHidden.each(function(){
                var ul = $(this);
                ul.attr('aria-hidden','false');
                var items = $this._getActionItems(ul);
                items.attr('tabindex', '0');
                $this._setVisAttr(ul, hidden);
            });
        } else {
            nonHidden.each(function(){
                var ul = $(this);
                ul.attr('aria-hidden','true');
                var items = $this._getActionItems(ul);
                items.attr('tabindex', '-1');
                $this._setVisAttr(ul, hidden);
            });
        }
    };

    // get all 1st level items that are clickable
    Plugin.prototype._getActionItems = function(el) {
        var data = el.data("menu");
        if (!data) {
            data = {};
            var items = el.children('li');
            var anchors = items.find('a');
            data.links = anchors.add(items.find('.'+prefix+'_item'));
            el.data('menu', data);
        }
        return data.links;
    };

    Plugin.prototype._outlines = function(state) {
        if (!state) {
            $('.'+prefix+'_item, .'+prefix+'_btn').css('outline','none');
        } else {
            $('.'+prefix+'_item, .'+prefix+'_btn').css('outline','');
        }
    };

    Plugin.prototype.toggle = function(){
        var $this = this;
        $this._menuToggle();
    };

    Plugin.prototype.open = function(){
        var $this = this;
        if ($this.btn.hasClass(prefix+'_collapsed')) {
            $this._menuToggle();
        }
    };

    Plugin.prototype.close = function(){
        var $this = this;
        if ($this.btn.hasClass(prefix+'_open')) {
            $this._menuToggle();
        }
    };

    $.fn[mobileMenu] = function ( options ) {
        var args = arguments;

        // Is the first parameter an object (options), or was omitted, instantiate a new instance
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {

                // Only allow the plugin to be instantiated once due to methods
                if (!$.data(this, 'plugin_' + mobileMenu)) {

                    // if it has no instance, create a new one, pass options to our plugin constructor,
                    // and store the plugin instance in the elements jQuery data object.
                    $.data(this, 'plugin_' + mobileMenu, new Plugin( this, options ));
                }
            });

        // If is a string and doesn't start with an underscore or 'init' function, treat this as a call to a public method.
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            // Cache the method call to make it possible to return a value
            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + mobileMenu);

                // Tests that there's already a plugin-instance and checks that the requested public method exists
                if (instance instanceof Plugin && typeof instance[options] === 'function') {

                    // Call the method of our plugin instance, and pass it the supplied arguments.
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
            });

            // If the earlier cached method gives a value back return the value, otherwise return this to preserve chainability.
            return returns !== undefined ? returns : this;
        }
    };
	/* End Slick library  */
	
	/* Distortion effect */
	var hoverEffect = function(opts) {
		var vertex = `
			varying vec2 vUv;
			void main() {
			  vUv = uv;
			  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		`;

		var fragment = `
			varying vec2 vUv;

			uniform sampler2D texture;
			uniform sampler2D texture2;
			uniform sampler2D disp;

			// uniform float time;
			// uniform float _rot;
			uniform float dispFactor;
			uniform float effectFactor;

			// vec2 rotate(vec2 v, float a) {
			//  float s = sin(a);
			//  float c = cos(a);
			//  mat2 m = mat2(c, -s, s, c);
			//  return m * v;
			// }

			void main() {

				vec2 uv = vUv;

				// uv -= 0.5;
				// vec2 rotUV = rotate(uv, _rot);
				// uv += 0.5;

				vec4 disp = texture2D(disp, uv);

				vec2 distortedPosition = vec2(uv.x + dispFactor * (disp.r*effectFactor), uv.y);
				vec2 distortedPosition2 = vec2(uv.x - (1.0 - dispFactor) * (disp.r*effectFactor), uv.y);

				vec4 _texture = texture2D(texture, distortedPosition);
				vec4 _texture2 = texture2D(texture2, distortedPosition2);

				vec4 finalTexture = mix(_texture, _texture2, dispFactor);

				gl_FragColor = finalTexture;
				// gl_FragColor = disp;
			}
		`;

		var parent = opts.parent || console.warn("no parent");
		var dispImage = opts.displacementImage || console.warn("displacement image missing");
		var image1 = opts.image1 || console.warn("first image missing");
		var image2 = opts.image2 || console.warn("second image missing");
		var intensity = opts.intensity || 1;
		var speedIn = opts.speedIn || 1.6;
		var speedOut = opts.speedOut || 1.2;
		var userHover = (opts.hover === undefined) ? true : opts.hover;
		var easing = opts.easing || Expo.easeOut;

		var mobileAndTabletcheck = function() {
		  var check = false;
		  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
		  return check;
		};

		var scene = new THREE.Scene();
		var camera = new THREE.OrthographicCamera(
			parent.offsetWidth / -2,
			parent.offsetWidth / 2,
			parent.offsetHeight / 2,
			parent.offsetHeight / -2,
			1,
			1000
		);

		camera.position.z = 1;

		var renderer = new THREE.WebGLRenderer({
			antialias: false,
			// alpha: true
		});

		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setClearColor(0xffffff, 0.0);
		renderer.setSize(parent.offsetWidth, parent.offsetHeight);
		parent.appendChild(renderer.domElement);

		// var addToGPU = function(t) {
		//     renderer.setTexture2D(t, 0);
		// };

		var loader = new THREE.TextureLoader();
		loader.crossOrigin = "";
		var texture1 = loader.load(image1);
		var texture2 = loader.load(image2);

		var disp = loader.load(dispImage);
		disp.wrapS = disp.wrapT = THREE.RepeatWrapping;

		texture1.magFilter = texture2.magFilter = THREE.LinearFilter;
		texture1.minFilter = texture2.minFilter = THREE.LinearFilter;

		texture1.anisotropy = renderer.getMaxAnisotropy();
		texture2.anisotropy = renderer.getMaxAnisotropy();

		var mat = new THREE.ShaderMaterial({
			uniforms: {
				effectFactor: { type: "f", value: intensity },
				dispFactor: { type: "f", value: 0.0 },
				texture: { type: "t", value: texture1 },
				texture2: { type: "t", value: texture2 },
				disp: { type: "t", value: disp }
			},

			vertexShader: vertex,
			fragmentShader: fragment,
			transparent: true,
			opacity: 1.0
		});

		var geometry = new THREE.PlaneBufferGeometry(
			parent.offsetWidth,
			parent.offsetHeight,
			1
		);
		var object = new THREE.Mesh(geometry, mat);
		scene.add(object);

		var addEvents = function(){
			var evtIn = "mouseenter";
			var evtOut = "mouseleave";
			if (mobileAndTabletcheck()) {
				evtIn = "touchstart";
				evtOut = "touchend";
			}
			parent.addEventListener(evtIn, function(e) {
				TweenMax.to(mat.uniforms.dispFactor, speedIn, {
					value: 1,
					ease: easing
				});
			});

			parent.addEventListener(evtOut, function(e) {
				TweenMax.to(mat.uniforms.dispFactor, speedOut, {
					value: 0,
					ease: easing
				});
			});
		};

		if (userHover) {
			addEvents();
		}

		window.addEventListener("resize", function(e) {
			renderer.setSize(parent.offsetWidth, parent.offsetHeight);
		});


		this.next = function(){
			TweenMax.to(mat.uniforms.dispFactor, speedIn, {
				value: 1,
				ease: easing
			});
		}

		this.previous = function(){
			TweenMax.to(mat.uniforms.dispFactor, speedOut, {
				value: 0,
				ease: easing
			});
		};

		var animate = function() {
			requestAnimationFrame(animate);

			renderer.render(scene, camera);
		};
		animate();
	};
	/* End Distortion effect */
	
	/* Slick Menu JS */
	if($('.main-menu').length) { 
		$('.main-menu').slicknav({
			label : '',
			prependTo : '.responsive-menu'
		});
	}
	
	
	$window.on('load', function(){
		
		/* Preloader Effect */
		$(".theme-preloader").fadeOut(600);

		/* Image Reveal Animation */
		if ($('.at-animation-image-style-1').length) {
			gsap.registerPlugin(ScrollTrigger);
			gsap.utils.toArray(".at-animation-image-style-1 img").forEach((img) => {
				gsap.to(img, {
					clipPath: "inset(0 0% 0 0)", 
					duration: 1.5,
					ease: "power2.out",
					scrollTrigger: {
						trigger: img,
						start: "top 90%",
						toggleActions: "play none none none"
					}
				});
			});
		}

		/* Text Effect Animation */
		if ($('.at-animation-heading-style-1 .elementor-heading-title, .at-animation-heading-style-1 .ekit-heading--title').length) {
			let staggerAmount 	= 0.05,
				translateXValue = 0,
				delayValue 		= 0.5,
				animatedTextElements = document.querySelectorAll('.at-animation-heading-style-1 .elementor-heading-title, .at-animation-heading-style-1 .ekit-heading--title');
			
			animatedTextElements.forEach((element) => {
				let animationSplitText = new SplitText(element, { type: "chars, words" });
					gsap.from(animationSplitText.words, {
					duration: 1,
					delay: delayValue,
					x: 20,
					autoAlpha: 0,
					stagger: staggerAmount,
					scrollTrigger: { trigger: element, start: "top 85%" },
					});
			});
			
		}
		
		if ($('.at-animation-heading-style-2 .elementor-heading-title, .at-animation-heading-style-2 .ekit-heading--title').length) {
			
			let	 staggerAmount 		= 0.03,
				 translateXValue	= 20,
				 delayValue 		= 0.1,
				 easeType 			= "power2.out",
				 animatedTextElements = document.querySelectorAll('.at-animation-heading-style-2 .elementor-heading-title, .at-animation-heading-style-2 .ekit-heading--title');
			
			animatedTextElements.forEach((element) => {
				let animationSplitText = new SplitText(element, { type: "chars, words" });
					gsap.from(animationSplitText.chars, {
						duration: 1,
						delay: delayValue,
						x: translateXValue,
						autoAlpha: 0,
						stagger: staggerAmount,
						ease: easeType,
						scrollTrigger: { trigger: element, start: "top 85%"},
					});
			});
			
		}
		
		if ($('.at-animation-heading-style-3 .elementor-heading-title, .at-animation-heading-style-3 .ekit-heading--title').length) {		
			let	animatedTextElements = document.querySelectorAll('.at-animation-heading-style-3 .elementor-heading-title, .at-animation-heading-style-3 .ekit-heading--title');
			
			 animatedTextElements.forEach((element) => {
				//Reset if needed
				if (element.animation) {
					element.animation.progress(1).kill();
					element.split.revert();
				}

				element.split = new SplitText(element, {
					type: "lines,words,chars",
					linesClass: "split-line",
				});
				gsap.set(element, { perspective: 400 });

				gsap.set(element.split.chars, {
					opacity: 0,
					x: "50",
				});

				element.animation = gsap.to(element.split.chars, {
					scrollTrigger: { trigger: element,	start: "top 90%" },
					x: "0",
					y: "0",
					rotateX: "0",
					opacity: 1,
					duration: 1,
					ease: Back.easeOut,
					stagger: 0.02,
				});
			});		
		}
		
		if($('.at-animation-heading-style-4 .elementor-heading-title, .at-animation-heading-style-4 .ekit-heading--title').length) {
			let	animatedTextElements = document.querySelectorAll('.at-animation-heading-style-4 .elementor-heading-title, .at-animation-heading-style-4 .ekit-heading--title');

			gsap.registerPlugin(SplitText); 
			animatedTextElements.forEach((el) => {
				
				el.split = new SplitText(el, { 
					type: "lines,words,chars",
					linesClass: "split-line"
				});
				
				if( $(el).hasClass('elementor-heading-title') || $(el).hasClass('ekit-heading--title') ){
					gsap.set(el.split.chars, {
						opacity: .3,
						x: "-7",
					});
				}
				el.anim = gsap.to(el.split.chars, {
					scrollTrigger: {
						trigger: el,
						start: "top 92%",
						end: "top 60%",
						markers: false,
						scrub: 1,
					},

					x: "0",
					y: "0",
					opacity: 1,
					duration: .7,
					stagger: 0.2,
				});
				
			});
		}
	});
	
	/* Awaiken Project */
	$( function() {
		var $portfolio = $('#awaiken-portfolio');
		if( $portfolio.length ) {
			var $grid = $portfolio.find('.awaiken-portfolio-grid');
			var $portfolio_filter = $portfolio.find('.awaiken-portfolio-grid__filters');

			$grid.imagesLoaded( function() {
				$grid.isotope({
					itemSelector: '.awaiken-portfolio-grid-item',
					masonry: {
						gutter: 30
					}
				})
			});

			$portfolio_filter.on( "click", "li", ( function() {
				var filterValue = $(this).attr('data-filter');
				$portfolio_filter.find("li").removeClass("active"),
				$(this).addClass("active"),
				$grid.isotope({
				   filter: filterValue
			   })
			}));
		}
	});
	
	
	var casestudy_grid = function ($scope, $) {
		var casestudy_grid_options = $scope.find(".awaiken-casestudy-widget").data("config");

		if (casestudy_grid_options && casestudy_grid_options.show_filter_bar === "yes") {
			var $portfolio = $("#awaiken-portfolio-" + casestudy_grid_options.id);
			var $grid = $portfolio.find(".awaiken-portfolio-grid");
			var $portfolio_filter = $portfolio.find(".awaiken-portfolio-grid__filters");

			// Ensure the grid and images exist before initializing
			if ($grid.length && $grid.find("img").length) {
				var isRTL = casestudy_grid_options.rtl === true || casestudy_grid_options.rtl === "true";
				$grid.imagesLoaded(function () {
					$grid.isotope({
						itemSelector: ".awaiken-portfolio-grid-item",
						layoutMode: "masonry",
						isOriginLeft: !isRTL,
						masonry: {
							gutter: parseInt(casestudy_grid_options.item_spacing) || 0, 
						},
					});

					$portfolio_filter.on("click", "li", function () {
						var filterValue = $(this).attr("data-filter");
						$portfolio_filter.find("li").removeClass("active");
						$(this).addClass("active");
						$grid.isotope({ filter: filterValue });
					});
				});
			}
		}
	};
	
	const dataItemHover = () => {
        const initHoverEffect = (container, images) => {
            const hoverInstance = new hoverEffect({
                parent: container.get(0),
                intensity: container.data("intensity") || undefined,
                speedIn: container.data("speedin") || undefined,
                speedOut: container.data("speedout") || undefined,
                easing: container.data("easing") || undefined,
                image1: images.eq(0).attr("src"),
                image2: images.eq(0).attr("src"),
                displacementImage: theme_vars.theme_uri + "/assets/images/image-effect.jpg",
                imagesRatio:  images[0].width / images[0].height,
                hover: false
            });

			container.closest('[data-element_type="container"]')
                .on("mouseenter", () => hoverInstance.next())
                .on("mouseleave", () => hoverInstance.previous());
        };

        const setupHoverAnimations = ($scope) => {
            const imageElements = $scope.find("img");
            if (!imageElements.length) return;

            const firstImage = imageElements.eq(0);
            if (firstImage[0].complete) {
                initHoverEffect($scope, imageElements);
            } else {
                firstImage.on("load", () => {
                    initHoverEffect($scope, imageElements);
                });
            }
        };

        return { setupHoverAnimations };
    };

	// Elementor frontend hook
	$window.on("elementor/frontend/init", function () {
		elementorFrontend.hooks.addAction("frontend/element_ready/denture-casestudy-grid.default", casestudy_grid );
		const hoverFx = dataItemHover();
        elementorFrontend.hooks.addAction("frontend/element_ready/image.default", function($scope){
            if ($scope.hasClass("at-distortion-effect")) {
                hoverFx.setupHoverAnimations($scope);
            }
        });
	});
	
	// When user clicks a nested tab
    $(document).on("click", ".e-n-tab-title", function () {
        var targetId = $(this).attr("aria-controls"); // Elementor tab button → content panel

        if (targetId) {
            setTimeout(function () {
                var $panel = $("#" + targetId);

                if ($panel.length) {
                    $panel.find(".image-comparison-container").each(function () {
                        var $container = $(this);

                        if ($container.data("twentytwenty-initialized")) {
                            // Refresh existing comparison
                            $(window).trigger("resize.twentytwenty");
                        } else {
                            // Initialize first time
                            $container.twentytwenty({
                                no_overlay: true
                            });
                            $container.data("twentytwenty-initialized", true);
                        }
                    });
                }
            }, 150); // small delay → ensure panel is visible
        }
    });
	
})(jQuery);