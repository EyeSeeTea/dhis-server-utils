/* 
   Copyright (c) 2016.
 
   This file is part of Project Manager.
 
   Project Manager is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
 
   Project Manager is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
 
   You should have received a copy of the GNU General Public License
   along with Project Manager.  If not, see <http://www.gnu.org/licenses/>. */

dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', function($scope, $filter, commonvariable, $timeout, ProgramsList) {
	
	var $translate = $filter('translate');

	  $scope.openstart = function($event) {
		    $event.preventDefault();
		    $event.stopPropagation();

		    $scope.openedstart = true;
		  };
	$scope.openend = function($event) {
			    $event.preventDefault();
			    $event.stopPropagation();

			    $scope.openedend = true;
			  };
			
			$scope.submit=function(){
				
				$scope.progressbarDisplayed = true;
				

				var fecha_inicio=$filter('date')($scope.start_date,'yyyy-MM-dd');
				var fecha_fin=$filter('date')($scope.end_date,'yyyy-MM-dd');

				var result=ProgramsList.get();
				
				
				
				//include current date in the file name, Helder
				var today = new Date();
				var dd = (today.getDate()<10?'0'+today.getDate():today.getDate());
				var mm = (today.getMonth()<9?'0'+(today.getMonth()+1):today.getMonth());
				var yyyy = today.getFullYear();

				//////
				var fileName =  $scope.file_name+"_"+yyyy+mm+dd;
				
				var orgUnits_filter="";
				
				result.$promise.then(function(data) {
					console.log('kk');
					console.log(data);
					console.log(data.programs);
					
				});
				
				$scope.progressbarDisplayed = false;
			}
	
	
	
}]);
