(function() {
	var app = angular.module('gemStore', []);
	
	var MAX_RESOLUTION = 5
	var MAX_ROWS = 4;
	var MAX_COLUMNS = 8;
	var PRELOAD_PIXEL_BUFFER = 100;
	var GLOBAL_column = 0;
	var GLOBAL_row = 0;
	
	app.controller('ImageController', function() {
		
		this.resolution = 0;
		this.column = GLOBAL_column;
		this.row = GLOBAL_row;
		
		this.updateImages = function() {
			this.images = this.makeHiddenImageMatrix();
		};
		
		this.updateResolution = function(res) {
			var newResolution = res + this.resolution;	
			if (newResolution < MAX_RESOLUTION && newResolution > -1) {
					this.resolution = newResolution;
					GLOBAL_row = Math.pow(2, GLOBAL_row);
					GLOBAL_column = Math.pow(2, GLOBAL_column);
					this.updateImages();
			}
		};
		
		this.showImageBlock = function(r, c) {
			if (r > -1 && c > -1) {
				var currentRowIndex = r * Math.pow(2, this.resolution) * MAX_ROWS;
				var currentColumnIndex = c * Math.pow(2, this.resolution) * MAX_COLUMNS;
				for (var _r = currentRowIndex; _r < currentRowIndex + MAX_ROWS; _r++) {
					for (var _c = currentColumnIndex; _c < currentColumnIndex + MAX_COLUMNS; _c++) {
						var elm = $("#" + _r + "_" + _c).closest(".ng-repeat-custom-class");
						elm.show();
						if (elm.width() < 256) {
							//for images that won't load properly  
							//elm.attr("src", "http://earthx-layers-data.s3.amazonaws.com/LAYDB-44-BlueMarble-data/1325376000000/0/0/0_0.jpg");
						}
					}
				}
			}			
		};
		
		this.isImageBlockVisible = function(r, c) {
			var currentRowIndex = r * Math.pow(2, this.resolution);
			var currentColumnIndex = c * Math.pow(2, this.resolution);
			return !$("#" + currentRowIndex + "_" + currentColumnIndex).closest(".ng-repeat-custom-class").is(':visible');
		};
		
		this.makeHiddenImageMatrix = function() {
			var completeMap = [];
			for (var row = 0; row < MAX_ROWS *  Math.pow(2, this.resolution); row++) {
				var mapRow = []
				for (var column = 0; column < MAX_COLUMNS * Math.pow(2,this.resolution); column++) {
					mapRow.push({
						url: "http://earthx-layers-data.s3.amazonaws.com/LAYDB-44-BlueMarble-data/1325376000000/" + this.resolution + "/" + row + "/" + row + "_" + column + ".jpg",
						id: row + "_" + column
					});
				}
				completeMap.unshift(mapRow);
			}
			return completeMap;
		};
		
		this.images = this.makeHiddenImageMatrix();
	});
		
	window.onload = function() {
		
	}

	app.directive('ngMouseWheelDown', function() {
		return {
			restrict: 'A',
			scope: false,
			controller: 'ImageController', 
			link: function(scope, element, attrs, ctrl) {
				element.bind("DOMMouseScroll mousewheel onmousewheel", function(event) {
					console.log('Run');
					var event = window.event || event;
					var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
					scope.$eval(attrs.ngMouseWheelDown);
					ctrl.updateResolution(delta);
					scope.imageCtrl.images = ctrl.images;
					scope.$apply();
				});
			}
		};
	});
	
	app.directive("scroll", function ($window) {
		return { 
			restrict: 'A',
			controller: 'ImageController',
			link: function(scope, element, attrs, ctrl) {
				angular.element($window).bind("scroll", function() {
					var scrollHeight = document.body.scrollHeight;
					var scrollWidth = document.body.scrollWidth;
					var yOffset = window.pageYOffset;
					var xOffset = window.pageXOffset;
					var innerHeight = window.innerHeight;
					var innerWidth = window.innerWidth;
					var row = Math.floor((scrollHeight - yOffset - (innerHeight / 2))  / 1024); //off by one erros 
					var column = Math.floor((xOffset + (innerWidth / 2)) / 2048);
					
					GLOBAL_column = column;
					GLOBAL_row = row;

					console.log("WHAT? " + row + column);
					
					if (scrollWidth - (innerWidth + xOffset) < PRELOAD_PIXEL_BUFFER && !ctrl.isImageBlockVisible(row,column + 1)) {
						console.log("trigger right preloaded images");
						ctrl.showImageBlock(row, column + 1);
					}
					if (xOffset < PRELOAD_PIXEL_BUFFER && !ctrl.isImageBlockVisible(row, column - 1)) {
						ctrl.showImageBlock(row, column - 1);
						console.log("trigger left preloaded images");
					}
					if (scrollHeight - (innerHeight + yOffset) < PRELOAD_PIXEL_BUFFER && !ctrl.isImageBlockVisible(row,column - 1)) {
						ctrl.showImageBlock(row - 1, column);
					}
					if (yOffset < PRELOAD_PIXEL_BUFFER && !ctrl.isImageBlockVisible(row + 1, column)) {
						ctrl.showImageBlock(row + 1, column);
					}
					if(ctrl.isImageBlockVisible(row, column)) {
						ctrl.showImageBlock(row, column);
					}
					
					scope.$apply();
				});
			}
		};
	});
	
	app.directive("showInitialBlock", function() {
		return {
			restrict: "A", 
			controller: "ImageController", 
			link: function(scope, element, attrs, ctrl, $timeout) {
				if (scope.$last === true) {
					var timeout = setInterval(function(){
						ctrl.showImageBlock(GLOBAL_row, GLOBAL_column);
					}, 20); 
				}
			}
		};
	});

})();