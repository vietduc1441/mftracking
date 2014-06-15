	dojo.provide("mftracking.widget.xDialog");
	dojo.require("mxui.widget._Popup");
	dojo.declare("mftracking.widget.xDialog",mxui.widget._Popup, {
	modal: false,
	caption: "",
	content: "",
	contentId: "",
	buttons: null,
	closable: true,
	autoFocus: true,
	resizable: true,
	_handler: null,
	_headerNode: null,
	_bodyNode: null,
	_footerNode: null,
	_captionNode: null,
	_closeButton: null,
	_prevFocus: null,
	_showAnim: null,
	_hideAnim: null,
	_layerId: 1,
	buildRendering: function() {
			 var $ = mxui.dom.create;
			this.buildDialog();
			this.setCaption(this.caption || this.translate(this.type, null, "Message"));
			var contentDiv = $("div", {id: this.contentId});
			contentDiv.innerHTML = mxui.dom.convertNlToBr(mxui.dom.escapeString(this.content));
			this.setContent(contentDiv);
			var _bd3 = $("button", {"class": "btn btn-primary"}, this.translate("ok", null, "Ok"));
			this.connect(_bd3, "click", function() {
				this.hide();
			});
			this.setButtons([_bd3]);
			dojo.addClass(this.domNode, "mx-dialog-" + this.type);
						
		},buildDialog: function() {
			var $ = mxui.dom.create;
			this.domNode = $("div", {"class": "modal-dialog mx-dialog"}, 
							this._contentNode = $("div", {"class": "modal-content mx-dialog-content"}, 
							this._headerNode = $("div", {"class": "modal-header mx-dialog-header"}, 
							this._captionNode = $("h4", {"class": "caption mx-dialog-caption"})), 
							this._bodyNode = $("div", {"class": "modal-body mx-dialog-body"}), 
							this._footerNode = $("div", {"class": "modal-footer mx-dialog-footer",
							style: "display: none"})));
			dojo.style(this.domNode, "opacity", 0);
			if (this.closable) {
				var closeBtn = this._closeButton = $("button", {type: "button","class": "close mx-dialog-close"});
				closeBtn.innerHTML = "&times;";
				this.connect(closeBtn, dojo.touch.press, function() {
					this.hide();
				});
				this._headerNode.insertBefore(closeBtn, this._captionNode);
			}
			mxui.wm.focus.addBox(this._footerNode);
		},show: function() {
			if (this._visible) {
				return;
			}
			this.onShow();
			var node = this.domNode, delay = this.delay;
			if (delay) {
				if (this._hideAnim && this._hideAnim.status() === "playing") {
					this._hideAnim.stop();
				}
				dojo.body().appendChild(node);
				this._showAnim = dojo.fadeIn({node: node,duration: delay});
				this._showAnim.play();
			} else {
				dojo.style(node, "opacity", 1);
				dojo.body().appendChild(node);
			}
			this._prevFocus = mxui.wm.focus.get();
			if (this._prevFocus) {
				this._prevFocus.blur();
			}
			if (this.autoFocus) {
				mxui.wm.focus.first(this._footerNode);
			}
			this._handler = this.connect(window, "orientationchange", "center");
			this.focus();
			this.resize();
			this.center();
		},hide: function(_b9a) {
			if (!this._visible) {
				return;
			}
			this.onHide();
			var node = this.domNode, delay = this.delay;
			this.disconnect(this._handler);
			var preFocus = this._prevFocus;
			if (preFocus) {
				var _b9d = mxui.wm.focus.get(), _b9e = true;
				if (_b9d) {
					_b9e = false;
					var elem = _b9d;
					while (elem = elem.parentNode) {
						if (elem === node) {
							_b9e = true;
							break;
						}
					}
				}
				if (_b9e) {
					mxui.wm.focus.put(preFocus);
				}
			}
			var self = this, end = function() {
				mxui.dom.orphan(node);
				dojo.style(node, "opacity", 0);
				self.onAfterHide();
				_b9a && _b9a();
			};
			if (delay) {
				if (this._showAnim && this._showAnim.status() === "playing") {
					this._showAnim.stop();
				}
				this._hideAnim = dojo.fadeOut({node: node,duration: delay,onEnd: end,onStop: end});
				this._hideAnim.play();
			} else {
				end();
			}
		},onAfterHide: function() {
		},layout: function() {
			var _bd9 = dojo.contentBox(this.domNode).h, _bda = dojo.marginBox(this._headerNode).h;
			dojo.contentBox(this._bodyNode, {h: _bd9 - _bda});
			this.resizeChildren(this._bodyNode);
		},setCaption: function(_ba2) {
			var _ba3 = mxui.dom.escapeString(_ba2);
			this._captionNode.innerHTML = _ba3 || "&nbsp;";
		},setContent: function(content) {
			mxui.dom.empty(this._bodyNode);
			if (content) {
				this._bodyNode.appendChild(mxui.dom.create("#", content));
			}
		},setButtons: function(btns) {
			mxui.dom.empty(this._footerNode);
			if (btns) {
				for (var i = 0, btn; btn = btns[i]; i++) {
					this._footerNode.appendChild(btn);
				}
				this._footerNode.style.display = "";
			}
		},
		onFocusPress: function(e, _bd4) {
                        var dk = dojo.keys, cc = e.charOrCode;
                        if (cc === dk.ESCAPE || cc === dk.ENTER || cc === " ") {
                            this.hide();
                        }
                    },
		uninitialize: function() {
			this.hide();
		}
	}
);
