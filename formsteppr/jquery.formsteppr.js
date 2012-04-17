// FormSteppr, a jQuery plugin that divides a form into steps using the forms fieldsets.
// by Johannes Holmberg
// http://jholmberg.com
// Version 0.5
(function($){

    $.fn.extend({ 
         
        formSteppr: function(options) {
 
            var defaults = {
                wrapperClass: 'formsteppr',
				prevButton: true,
				prevButtonText: 'Back',
				nextButtonText: 'Next step',
				errorMessage: 'This field cannot be empty.',
				errorMessageEmail: 'This looks like an invalid email address.',
				errorMessagePhone: 'This looks like an invalid phone number.',
				requiredFieldText: 'Field is required.'
            }
                 
            var options =  $.extend(defaults, options);

            return this.each(function() {
             
				var o = options;
				
				//Put the form in a variable and wrap it in a div
				var form = $(this);
				form.wrap('<div class="'+o.wrapperClass+'"></div>');

				//Get the fieldsets and hide them				
				form.find('fieldset:gt(0)').addClass('s-hidden');	
				form.find('legend').addClass('s-hidden');
				
				//Get the first fieldset and display it
				$('fieldset').first().addClass('s-display');	
				
				//Inserts the progress overview holder
				$('<nav class="fs-progress"></nav>').insertBefore(form);
				form.parent().find('.fs-progress').append('<ul></ul>');
				
				//Append the submit button to the last fieldset
				var lastFieldset = $('fieldset').last();
				form.find('[type="submit"]').addClass('fs-submit-button').appendTo(lastFieldset);				
				
				//Get number of fieldsets and create as many next step buttons
				var numberOfFieldset = form.find('fieldset').length;
				var nextButton = new Array();
				for (var i = 1; i < numberOfFieldset; i++) {
					nextButton.push($('<button />').text(o.nextButtonText).attr('id', 'next-step-' + i).attr('class', 'button proceed'));
				}
				
				//Create back buttons if necessary
				if(o.prevButton) {
					var prevButton = new Array();
					for (var i = 1; i < numberOfFieldset; i++) {
						prevButton.push($('<button />').text(o.prevButtonText).attr('id', 'prev-step-' + i).attr('class', 'button back'));
					}				
				}
				
				//Go through all the inputs and add required sign if they are required
				$('input, textarea').each(function(){
					
					//Put the input and the corresponding label in a wrapper
					var inputWrap = $('<div class="fs-input-wrap" />');
					$(inputWrap).appendTo($(this).parents('fieldset'));
					var inputId = $(this).attr('id');
					$(this).parent().find('label[for="'+inputId+'"]').appendTo(inputWrap);
					$(this).appendTo(inputWrap);					
					
					var attr = $(this).attr('required');
					if (typeof attr !== 'undefined' && attr !== false) {
						$(this).siblings('label').append('<span class="fs-field-required">*</span>');
						
						var placeholder = $(this).attr('placeholder');
						if(placeholder !== undefined) {
							placeholder += ' *';
							$(this).attr('placeholder', placeholder);						
						}
						
						$(this).parents('fieldset').find('.fs-required-text').remove();
						$(this).parents('fieldset').prepend('<div class="fs-required-text">* ' + o.requiredFieldText + '</div>');
					}										
				});
				
				//Sets the focus on the first input
				$(this).find('input').first().focus();				
	
				//Validate each input when it's blurred
				$('input, textarea').blur(function(){
				
					var attr = $(this).attr('required');
					
					//First check if the field is required
					if (typeof attr !== 'undefined' && attr !== false) {	
						$(this).removeClass();
						
						//For emails
						if($(this).is('[type=email]')) {
							var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
							if(!filter.test($(this).val())) {
								$(this).addClass('fs-invalid');
							}
							else {
								$(this).addClass('fs-valid').parent().find('.fs-error-message').removeClass().addClass('s-hidden');
							}
						}
						
						//For phones
						else if($(this).is('[type=tel]')) {
							var filter = /^(\+)?[0-9 -]*[0-9]$/;
							if(!filter.test($(this).val())) {
								$(this).addClass('fs-invalid');
							}
							else {
								$(this).addClass('fs-valid').parent().find('.fs-error-message').removeClass().addClass('s-hidden');
							}
						}												
						
						else {
							//Just check to see if field is empty
							if($(this).val().length === 0) {
								$(this).addClass('fs-invalid');			
							}
							else {
								$(this).addClass('fs-valid').parent().find('.fs-error-message').removeClass().addClass('s-hidden');
							}							
						}
					}				
				});
				
				//Create a global step variable to know which step we're on
				var stepGlobal;				
				
				//Go through all the buttons append them to their correct fieldset
				for (var i = 0; i < nextButton.length + 1; i++ ){
				
					//Append correct button to each fieldset
					var counter = i + 1;
					var thisFieldset = $('fieldset:eq('+i+')');
					
					var buttonWrapper = $('<div class="fs-buttons"></div>');
					buttonWrapper.append(nextButton[i]);
					if(o.prevButton && counter != 1) {
						buttonWrapper.append(prevButton[i]);
					}					
					thisFieldset.attr('id', 'step-' + counter).append(buttonWrapper);
			
					//Gets the first legend for the fieldset and put the name in the steps progress
					var fieldsetTitle = thisFieldset.find('legend:eq(0)').text();
					var stepTitle = $('<a></a>').attr('href', '#').text(fieldsetTitle).attr('class', 'step-' + counter);
					var stepTitleLi = $('<li></li>');
					$(stepTitleLi).append(stepTitle);
					form.parent().find('.fs-progress ul').append(stepTitleLi);
					
					//Add click event for each button to go the next step
					$('#next-step-' + i).click(function(){

						//Removes all the error message initially
						$('.fs-error-message').removeClass('s-display').addClass('s-hidden');
						
						var error = validateStep($(this).parent().parent().find('input, textarea'));				
						
						if(error.length == 0) {
							//Removes the active class in the progressbar and add it to the next item, also adds the class through
							form.parent().find('.fs-progress').find('.active').removeClass('active')
								.addClass('through').parent().next().find('a').addClass('active');
						
							$(this).parent().parent().fadeOut(200, function(){
								$(this).removeClass('s-display').addClass('s-hidden');
								$(this).next().fadeIn(200, function(){
									$(this).removeClass('s-hidden').addClass('s-display');
									stepGlobal = $(this);
									$(this).find('input, textarea, select').first().focus();
								});				
							});				
						}
						else {
							showErrors(error);
						}
						return false;
					});
					//Add click event for each button to go the previous step
					$('#prev-step-' + i).click(function(){

						//Removes the active class in the progressbar and add it to the previous item, also adds the class through
						form.parent().find('.fs-progress').find('.active').removeClass('active').parent().prev().find('a').addClass('active');
					
						$(this).parent().parent().fadeOut(200, function(){
							$(this).removeClass('s-display').addClass('s-hidden');
							$(this).prev().fadeIn(200, function(){
								$(this).removeClass('s-hidden').addClass('s-display');
								stepGlobal = $(this);
								$(this).find('input, textarea, select').first().focus();
							});				
						});

						return false;
					});					
					var j = i + 1;
					//When you click on the progress buttons, go the right fieldset
					$('.step-' + j).click(function(){
						
						if($(this).hasClass('through')) {
						
							var step = $(this).attr('class').split(' ')[0];
							var goToStepCounter = step.split('-')[1];
							var currentStepCounter = stepGlobal.attr('id').split('-')[1];
							
							//Removes all the error message initially
							$('.fs-error-message').removeClass('s-display').addClass('s-hidden');						
							
							var error = validateStep(stepGlobal.find('input, textarea'));		
						
							if(error.length == 0) {
								$('.step-' + currentStepCounter).addClass('through');
								var counter = step.split('-')[1] - 1;
								
								form.parent().find('.fs-progress').find('a').removeClass('active');
								$(this).addClass('active');
								
								form.find('fieldset').hide();
								$('#' + step).show();
								stepGlobal = form.find('#' + step);			
							}
							else {
								showErrors(error);
								return false;
							}							
						}
						return false;
					});				
				}	
				
				//Add active to the first steps progress
				form.parent().find('.fs-progress').find('a:eq(0)').addClass('active');
				
				//Checks the final step and see if we have any errors before we submit
				form.submit(function(){
					//Removes all the error message initially
					$('.fs-error-message').removeClass('s-display').addClass('s-hidden');				
					var error = validateStep($('input, textarea'));
					
					if(error.length > 0) {
						showErrors(error);
						return false;				
					}				
				});				
				
				//Validate inputs
				function validateStep(fields) {
					var errors = new Array();
					
					for (var i = 0; i < fields.length; i++) {
						var attr = $(fields[i]).attr('required');
						
						//First check if the field is required
						if (typeof attr !== 'undefined' && attr !== false) {	
							
							//For emails
							if($(fields[i]).is('[type=email]')) {
								var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
								if(!filter.test($(fields[i]).val())) {
									errors.push([$(fields[i]), 'email']);
								}
							}
							//For phones
							else if($(fields[i]).is('[type=tel]')) {
								var filter = /^(\+)?[0-9 -]*[0-9]$/;
								if(!filter.test($(fields[i]).val())) {
									errors.push([$(fields[i]), 'phone']);
								}
							}														
							else {
								//Just check to see if field is empty
								if($(fields[i]).val().length === 0) {
									errors.push($(fields[i]));					
								}							
							}
						}					
					}
					return errors;
				}
				
				//Displaying correct error messages
				function showErrors(error) {
					//Loop through all the inputs and display their error message
					for(var i = 0; i < error.length; i++) {
						var err = o.errorMessage;
						if(error[i][1] == 'email'){
							err = o.errorMessageEmail;
						}
						else if(error[i][1] == 'phone'){
							err = o.errorMessagePhone;
						}						
						var errorMessage = $('<div class="fs-error-message">'+err+'</div>');
						
						//Adds the errormessage to the containing div
						$(error[i][0]).parent().append(errorMessage);
						
						$(error[i][0]).addClass('fs-invalid');
					}
					//Sets the focus on the first input that needs to be fixed
					$(error[0]).focus();				
				}
             
            });
        }
    });  
})(jQuery);