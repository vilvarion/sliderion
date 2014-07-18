angular.module('SilderionApp', [])

.factory('FileManager', function ($rootScope, $http) {

	/*
	* FileManager забирает json файл с слайдами и передает в нашу директиву
	*/			

	return {
		getSlides: function (src) {
			var data = {};

			$http({method: 'GET', url: "/" + src + "/slides.json"})
			.success(function (res) {
				data.result = true;
				data.content = res;
			})
			.error(function() {
				data.result = false;
				data.error = "Не нахожу данных для презентации!";
			});

			return data;
		}
	}
})

.directive('sliderion', function() {
	return {
		restrict: 'E',
		templateUrl: 'sliderion.html',
		scope: {
			src: '@'
		},		
		controller: function($scope, FileManager) {

			/*
			* Состояния по-умолчанию
			*/			

			$scope.slides = FileManager.getSlides( $scope.src );

			$scope.currentSlide = 0;
			$scope.fullscreen = false;
			$scope.sideBar = false;

			
			/*
			* Работа со слайдами
			*/			

			$scope.firstSlide = function () {
				$scope.currentSlide = 0;
			}
			$scope.prevSlide = function () {
				$scope.currentSlide--;
			}
			$scope.nextSlide = function () {
				$scope.currentSlide++;
			}
			$scope.lastSlide = function () {
				$scope.currentSlide = $scope.slides.content.length-1;
			}

			$scope.goToSlide = function (index) {
				$scope.currentSlide = index;
			}

			$scope.sidebarToggle = function () {
				$scope.sideBar = $scope.sideBar ? false : true;
			}





			/*
			* Работа с фулскрином
			*/

			// для браузеров, которые не выходят по esc сами
		    $('html').keydown(function (event) {
		        if (event.keyCode == 27) {
		            fullScreenCancel();
		        }
		    });

			$scope.goFullscreen = function () {
	            fullScreen(document.documentElement);
			}

			$scope.exitFullscreen = function () {
	            fullScreenCancel();
				$("html").unbind();
			}

		    function fullScreen(element) {
		        if (element.requestFullscreen) {
		            element.requestFullscreen();
		        } else if (element.webkitRequestFullscreen) {
		            element.webkitRequestFullscreen();
		        } else if (element.mozRequestFullScreen) {
		            element.mozRequestFullScreen();
		        }

				$scope.fullscreen = true;

				// событие fullscreenchange происходит после анимации перехода в фулскрин.
				// дожидаемся окончания анимации и биндим события
		        setTimeout(function() {

					$("html").one( "fullscreenchange", fullscreenOut);		        	
					$("html").one( "webkitfullscreenchange", fullscreenOut);		        	
					$("html").one( "mozfullscreenchange", fullscreenOut);		        	
					$("html").one( "MSFullscreenChange", fullscreenOut);		        	
	    
		        }, 1000);

		    }

		    function fullScreenCancel() {
				if(document.exitFullscreen) {
					document.exitFullscreen();
				} else if(document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if(document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
				$scope.fullscreen = false;
		    }

		    function fullscreenOut () {
		    	// на случай если браузер сам выйдет из фулскрина,
		    	// а ангуляр не поймает
		    	$('.fullscreen').removeClass('fullscreen');
		    }
			
		}
	}
});

