angular.module('SilderionApp', [])

.factory('FileManager', function ($rootScope, $http) {

	/*
	* FileManager забирает json файл с слайдами и передает в нашу директиву
	*/			

	return {
		getSlides: function (src) {
			var data = {};

			$http({method: 'GET', url: src + "/slides.json"})
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
			src: '@',
			playback: '@' // autostart, showicon, manual
		},
		controller: function($scope, $timeout, $interval, FileManager) {

			/*
			* Состояния по-умолчанию
			*/			

			$scope.slides = FileManager.getSlides( $scope.src );

			$scope.audio = new Audio();

			$scope.currentSlide = 0;
			$scope.currentAudio = '';
			$scope.currentPlay = false;

			$scope.defaultDelay = 4000;
			$scope.fullscreen = false;
			$scope.subtitles = true;
			$scope.progress = 0; // прогресс-бар
			$scope.sideBar = false;
			$scope.volume = true;

			$scope.haveAudio = function() {
				// проверяем, есть ли хотябы один аудио файл
				var res = false; 
				angular.forEach($scope.slides.content, function (slide) {
					if(slide.audio) {
						res = true;
					}
				});	
				return res;
			}
			$scope.haveSubs = function() {
				// проверяем, есть ли хотябы файл субтитров
				var res = false; 
				angular.forEach($scope.slides.content, function (slide) {
					if(slide.subtitles) {
						res = true;
					}
				});	
				return res;
			}			

			// playIcon - оверлей с кнопкой play
			$scope.playIcon = ($scope.playback == 'showicon') ? true : false;

			// действие при автостарте
			if($scope.playback == 'autostart') {
				$scope.$watch('slides', function () {
					$scope.play();
				});				
			}

			// запускаем автопроигрывание
			$scope.play = function () {

				$scope.currentPlay = true;
				$scope.playAudio();	

				var delay = $scope.slides.content[ $scope.currentSlide ].delay;
				// если нет информации по длительности кадра
				if(!delay) {
					delay = $scope.defaultDelay;
				}

				$scope.progress = 0;

				$scope.progressWork = $interval(function() {
					$scope.progress++;
				}, delay/100, 100);

				// отсчитываем задержку перед следующим слайдом
				$scope.playSlide = $timeout(function () {
					if($scope.slides.content[ $scope.currentSlide+1 ]) {
						// переходим на следующий слайд
						$scope.currentSlide++;
					}else{
						// проиграли последний слайд, стоп и идем в начало
						$scope.currentSlide = 0;
						$scope.currentPlay = false;
					}
				}, delay, $scope.currentPlay);
			}

			$scope.playAudio = function () {
				var audio = $scope.slides.content[ $scope.currentSlide ].audio;
				if(audio) {
					$scope.audio.src = $scope.src + '/' + audio;
					$scope.audio.play();				
				}
			}

			// ловим изменения текущих слайдов
			$scope.$watch('currentSlide', function () {
				// если слайды уже загрузились ()
				if($scope.slides.content && $scope.currentPlay) {  // не играть при ручном перелистывании
					$scope.playAudio();
				}
				// если слайд изменился в режиме проигрывания - обрабатываем следующий
				if($scope.currentPlay) {
					$scope.play();
				}
			});


			$scope.stop = function () {
				// останавливаем режим проигрывания
				$scope.currentPlay = false;
				// останавливаем аудио
				$scope.audio.pause();
				// отменяем таймер кадра
				$timeout.cancel( $scope.playSlide );
				$interval.cancel( $scope.progressWork );
			}



			$scope.audioOff = function () {
				$scope.audio.muted = true;
				$scope.volume = false;
			}
			$scope.audioOn = function () {
				$scope.audio.muted = false;
				$scope.volume = true;
			}
			
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

