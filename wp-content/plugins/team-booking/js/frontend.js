jQuery(document).ready(function ($) {

    /*
     * Changing the month on the frontend calendar.
     */
    function tbkChangeMonth(calendar, $calendar, $clicked) {
        if (calendar.hasClass('loading')) return false;
        // We're put the calendar area in a loading state
        calendar.toggleClass('tbk-loading');
        // Let's grab the frontend calendar parameters
        var params = calendar.attr('data-params');
        // We need also the explicit instance value
        var instance = calendar.attr('data-instance');
        // Let's post the request for the new month via Ajax
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_change_month',
                month : $clicked.attr('data-month'),
                year  : $clicked.attr('data-year'),
                params: params
            },
            function (response) {
                calendar.find('.tbk-slide.tbk-active').html(response.content);
                calendar.attr('data-params', response.parameters);
                calendar.toggleClass('tbk-loading');
                $calendar.getSlider().adaptHeight();
            }, "json"
        );
        return false;
    }

    /*
     * Open the selected day slots list
     */
    function tbkLoadSlots(calendar, $calendar, $clicked) {
        if (calendar.hasClass('loading')) return false;
        calendar.find('.tbk-calendar-month-selector.active, .tbk-calendar-year-selector.active').trigger('click');
        // Let's grab the calendar area parameters
        var params = calendar.attr('data-params');
        // We need also the explicit instance value
        var instance = calendar.attr('data-instance');
        // We're put the calendar area in a loading state
        calendar.toggleClass('tbk-loading');
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_show_day_schedule',
                day   : $clicked.attr('data-day'),
                slots : $clicked.attr('data-slots'),
                params: params
            },
            function (response) {
                $calendar.showSlots(response.content);
                calendar.toggleClass('tbk-loading');
            }, "json"
        );
        return false;
    }

    function tbkCheckoutRequest(calendar, $calendar, $clicked) {
        if ($clicked.hasClass('tbk-loading')) {
            return;
        }
        $clicked.toggleClass('tbk-loading');
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_checkout'
            },
            function (response) {
                var $slider = $calendar.getSlider();
                var content = response.content;
                if ($clicked.hasClass('tbk-edit-form-action tbk-cancel')) {
                    $slider.replaceSlide(content);
                } else {
                    $slider.goToSlide($slider.addSlide(content).index()).adaptHeight();
                }
                if (response.action === 'empty_cart') {
                    $('.tbk-cart').addClass('tbk-cart-empty');
                }
                $('.tbk-cart').removeClass('tbk-selected').hide().find('.tbk-menu').hide();
                $clicked.toggleClass('tbk-loading');
            }, "json"
        );
    }

    function tbkRemoveItemFromCart(calendar, $calendar, $clicked) {
        var item_type = $clicked.attr('data-type');
        var item_id = $clicked.attr('data-item');
        $clicked.toggleClass('tbk-loading');
        $.post(
            TB_Ajax.ajax_url,
            {
                action : 'tbajax_action_put_slot_into_cart',
                slot_id: item_id,
                remove : true
            },
            function (response) {
                if (response.response === 'removed') {
                    $(document).find("[data-slot-id='" + item_id + "']").each(function () {
                        $(this).removeClass('tbk-in-cart');
                    });
                    $(document).find("[data-item='" + item_id + "']").each(function () {
                        var new_number = parseInt($(this).closest('.tbk-cart').find('.tbk-cart-dot').text()) - 1;
                        if (new_number < 1) {
                            $(this).closest('.tbk-cart').addClass('tbk-cart-empty').hide().find('.tbk-cart-dot').text(new_number);
                            $(this).closest('.tbk-menu').hide();
                            $(this).closest('.tbk-cart').trigger('tbk:cart:empty');
                        } else {
                            $(this).closest('.tbk-cart').removeClass('tbk-cart-empty').show().find('.tbk-cart-dot').text(new_number);
                            $(this).closest('.tbk-cart').trigger('tbk:cart:removed');
                        }
                        $(this).closest('.tbk-menu-item').remove();
                    });
                }
                $clicked.toggleClass('tbk-loading');
            }, "json"
        );
    }

    /*
     * Put/remove the slot into the cart
     */
    function tbkPutSlotIntoCart(calendar, $calendar, $clicked) {
        var selected = $clicked.closest('.tbk-schedule-slot, .tbk-upcoming-slot');
        // Put the slot in a loading status
        selected.toggleClass('tbk-loading');
        // Let's collect useful variables
        var slot = selected.attr('data-slot');
        var slot_id = selected.attr('data-slot-id');
        var remove = selected.hasClass('tbk-in-cart');
        // Selected timezone
        var $container = $clicked.closest('.calendar_main_container, .calendar_widget_container');
        var timezone = $container.find('.tbk-timezones .tbk-menu .tbk-menu-item.tbk-selected').data('timezone') || false;
        // Let's load the content
        $.post(
            TB_Ajax.ajax_url,
            {
                action  : 'tbajax_action_put_slot_into_cart',
                slot    : slot,
                slot_id : slot_id,
                timezone: timezone,
                remove  : remove
            },
            function (response) {
                if (response.response === 'added') {
                    $(document).find("[data-slot-id='" + slot_id + "']").each(function () {
                        $(this).addClass('tbk-in-cart');
                    });
                    $(document).find('.tbk-cart').each(function () {
                        var new_number = parseInt($(this).find('.tbk-cart-dot').text()) + 1;
                        $(this).removeClass('tbk-cart-empty').show().find('.tbk-cart-dot').text(new_number);
                        $(this).find('.tbk-menu .tbk-menu-item:last').before(response.data);
                        $(this).trigger('tbk:cart:added');
                    });
                }
                if (response.response === 'removed') {
                    $(document).find("[data-slot-id='" + slot_id + "']").each(function () {
                        $(this).removeClass('tbk-in-cart');
                    });
                    $(document).find('.tbk-cart').each(function () {
                        var new_number = parseInt($(this).find('.tbk-cart-dot').text()) - 1;
                        if (new_number < 1) {
                            $(this).addClass('tbk-cart-empty').hide().find('.tbk-cart-dot').text(new_number);
                            $(this).trigger('tbk:cart:empty');
                        } else {
                            $(this).removeClass('tbk-cart-empty').show().find('.tbk-cart-dot').text(new_number);
                            $(this).trigger('tbk:cart:removed');
                        }
                    });
                    $(document).find("[data-item='" + slot_id + "']").parent().remove();
                }
                selected.toggleClass('tbk-loading');
            }, "json"
        );
    }

    /*
     * Open the reservation form
     */
    function tbkLoadReservationForm(calendar, $calendar, $clicked) {
        var clicked = $clicked;
        if (calendar.find('.tbk-schedule-slot, .tbk-upcoming-slot').hasClass('tbk-loading')) {
            return false;
        }
        if (clicked.hasClass('tbk-slot-button')) {
            clicked = $clicked.closest('.tbk-schedule-slot, .tbk-upcoming-slot');
        }
        // Put the slot in a loading status
        clicked.toggleClass('tbk-loading');
        // Let's collect useful variables
        var slot = clicked.attr('data-slot');

        // Let's load the content
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_get_reservation_modal',
                slot  : slot
            },
            function (response) {
                var $slider = $calendar.getSlider();
                var $reservation_slider = $slider.addSlide(response.content);
                $slider.goToSlide($reservation_slider.index()).adaptHeight();
                // wait for images to be loaded, if any
                $reservation_slider.find('img').on('load', function () {
                    $slider.adaptHeight();
                });
                clicked.toggleClass('tbk-loading');
                $calendar.scrollToTop($clicked);
            }, "json"
        );
    }

    function tbkUpcomingShowMore(calendar, $calendar, $clicked) {
        if ($clicked.hasClass('tbk-loading')) {
            return false;
        }
        $clicked.toggleClass('tbk-loading');
        var params = $clicked.closest('.tb-frontend-calendar').attr('data-params');
        var increment = $clicked.attr('data-increment');
        var limit = $clicked.attr('data-limit');
        $.post(
            TB_Ajax.ajax_url,
            {
                action   : 'tbajax_action_upcoming_more',
                increment: increment,
                params   : params,
                limit    : limit
            },
            function (response) {
                calendar.find('.tbk-slide.tbk-active').html(response.content);
                calendar.attr('data-params', response.parameters);
                $calendar.getSlider().adaptHeight();
            }, "json"
        );
    }

    /*
     * Open the register/login dimmer
     */
    function tbkOpenLoginDimmer(calendar, $calendar, $clicked) {
        // Put the book button in a loading status
        $clicked.toggleClass('tbk-loading');
        var event = $clicked.attr('data-event');
        var coworker = $clicked.attr('data-coworker');
        var service = $clicked.attr('data-service');
        var post_id = $clicked.closest('.tb-frontend-calendar').parent().attr('data-postid');
        // Let's load the modal content
        $.post(
            TB_Ajax.ajax_url,
            {
                action  : 'tbajax_action_get_register_modal',
                event   : event,
                coworker: coworker,
                service : service,
                post_id : post_id
            },
            function (response) {
                calendar.find('.tbk-dimmer').html(response).addClass('tbk-active');
                $clicked.toggleClass('tbk-loading');
                $.tbkSliderGet(calendar).adaptHeight();
            });
    }

    /*
     * Save the cookie consent
     */
    function tbkSaveCookieConsent(calendar, $calendar, $clicked) {
        // Put the book button in a loading status
        $clicked.toggleClass('tbk-loading');
        var allow = !!$clicked.hasClass('tbk-allow');
        // Let's load the modal content
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_save_cookie_consent',
                allow : allow
            },
            function (response) {
                location.reload(true);
            });
    }

    /*
     * Fast month selector button
     */
    function tbkFastMonthInit(calendar, $calendar, $clicked) {
        // Grab some variables
        var month = $clicked.attr('data-month'); // from 01 to 12
        var params = calendar.attr('data-params');
        // Let's put the calendar container in a loading state
        calendar.toggleClass('tbk-loading');
        // Let's post the slots for the filtered calendar via Ajax
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_fast_month_selector',
                month : month,
                params: params
            },
            function (response) {
                calendar.find('.tbk-slide.tbk-active').html(response.content);
                calendar.attr('data-params', response.parameters);
                calendar.toggleClass('tbk-loading');
                $calendar.getSlider().adaptHeight();
            }, "json"
        );
    }

    /*
     * Fast year selector button
     */
    function tbkFastYearInit(calendar, $calendar, $clicked) {
        // Grab some variables
        var year = $clicked.attr('data-year');
        var params = calendar.attr('data-params');
        // Let's put the calendar container in a loading state
        calendar.toggleClass('tbk-loading');
        // Let's post the slots for the filtered calendar via Ajax
        $.post(
            TB_Ajax.ajax_url,
            {
                action: 'tbajax_action_fast_year_selector',
                year  : year,
                params: params
            },
            function (response) {
                calendar.find('.tbk-slide.tbk-active').html(response.content);
                calendar.attr('data-params', response.parameters);
                calendar.toggleClass('tbk-loading');
                $calendar.getSlider().adaptHeight();
            }, "json"
        );
    }

    // Cancel reservation action (frontend reservation list)
    $("table.tb-reservations-list a.tb-cancel-reservation").on('click', function (e) {
        var $clicked = $(this);
        e.preventDefault();
        var reservation_id = $clicked.data('id');
        var reservation_hash = $clicked.data('hash');
        var modal_id_random = $clicked.data('modal');

        var modal = $('#tbk-modal-' + modal_id_random).remodal();
        modal.open();
        $('#tbk-modal-' + modal_id_random)
            .data('id', reservation_id)
            .data('hash', reservation_hash)
        ;
    });
    $(document).on('confirmation', '.tbk-reservation-cancel-modal', function () {
        if ($(this).hasClass('tbk-loading')) return false;
        $(this).addClass('tbk-loading');
        $.post(
            TB_Ajax.ajax_url,
            {
                action          : 'tbajax_action_cancel_reservation',
                reservation_id  : $(this).data('id'),
                reservation_hash: $(this).data('hash')
            },
            function (response) {
                if (response.response == 'ok') {
                    location.reload(true);
                } else {
                    $(this).removeClass('tbk-loading');
                    console.log(response);
                }
            }, "json"
        );
    });

    function tbkCalendar(calendar) {
        var self = this;
        var $slider = null;

        this.getSlider = function () {
            return $slider;
        };

        this.init = function () {
            $slider = new tbkSlider(calendar);
            $slider.init();
            calendar
                .on('click keydown', '.tbk-calendar-month-selector', function (e) {
                    return self.makeAccessible(e, self.showMonths);
                })
                .on('click keydown', '.tbk-calendar-year-selector', function (e) {
                    return self.makeAccessible(e, self.showYears);
                })
                .on('click keydown', '.tbk-back-to', function (e) {
                    if ($(this).hasClass('tbk-show-cart-menu')) {
                        $(document).find('.tbk-cart').each(function () {
                            if (!$(this).hasClass('tbk-cart-empty')) {
                                $(this).show();
                            }
                        });
                    }
                    if ($(this).hasClass('tbk-back-to-calendar')) {
                        return self.makeAccessible(e, self.backToCalendar);
                    } else {
                        return self.makeAccessible(e, self.backToPrevious);
                    }
                })
                .on("click keydown", ".ui.tb-day.slots", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkLoadSlots(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-cart-next-step", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        if ($(this).hasClass('tbk-loading') === false) {
                            self.bookNow($(this));
                        }
                        return false;
                    }
                })
                .on("form:book", ".tbk-reservation-form", function (e, $clicked) {
                    self.bookNow($clicked);
                })
                .on("click keydown", ".tbk-cart-cancel-process", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        if ($(this).hasClass('tbk-loading') === false) {
                            self.cancelCheckout($(this));
                        }
                        return false;
                    }
                })
                .on("click keydown", ".tbk-book-confirmation-button", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        if ($(this).hasClass('tbk-loading') === false) {
                            self.confirmBooking($(this));
                        }
                        return false;
                    }
                })
                .on("click keydown", ".tbk-refresh", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        $(this).addClass('tbk-loading');
                        var result = $(document).triggerHandler('tbk:is:refreshing');
                        if (typeof(result) === 'undefined') {
                            location.reload(true);
                        } else {
                            $(this).removeClass('tbk-loading');
                        }
                        return false;
                    }
                })
                .on("click keydown", ".tb-change-month", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkChangeMonth(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-slide .tb-book", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkLoadReservationForm(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-slide .tbk-add", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkPutSlotIntoCart(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-show-more", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkUpcomingShowMore(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-schedule-slot.tb-book-advice, .tbk-upcoming-slot.tb-book-advice", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkOpenLoginDimmer(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-cookie", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkSaveCookieConsent(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tb-fast-selector-month-panel .tbk-month-selector", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkFastMonthInit(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tb-fast-selector-year-panel .tbk-year-selector", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkFastYearInit(calendar, self, $(this));
                        return false;
                    }
                })
                .on('click keydown', '.tbk-edit-form', function (e) {
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        var service = $(this).data('service');
                        var $calendar = $(this).closest('.tb-frontend-calendar');
                        $calendar.addClass('tbk-loading');
                        $.post(
                            TB_Ajax.ajax_url,
                            {
                                action : 'tbajax_action_checkout_edit_form',
                                service: service
                            },
                            function (response) {
                                $slider.replaceSlide(response.content);
                                $calendar.removeClass('tbk-loading');
                            }, "json"
                        );
                    }
                })
                .on('click keydown', '.tbk-edit-form-action.tbk-cancel', function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkCheckoutRequest(calendar, self, $(this));
                        return false;
                    }
                })
                .on('click keydown', '.tbk-schedule-filter-icon', function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        var target = $(this).data('target');
                        $(this).toggleClass('tbk-selected');
                        calendar.find('.tbk-' + target + '-filter-panel').toggleClass('lifted');
                        $slider.adaptHeight();
                        return false;
                    }
                })
                .on('change input', '.tbk-summary-table input', function () {
                    var x = parseInt($(this).val()) || 1;
                    var max = parseInt(this.getAttribute('max'));
                    if (x > max) {
                        $(this).val(max);
                    }
                    $(this).closest('tr').find('.tbk-summary-row-unit-price').trigger('amount:update');
                    $slider.getCurrentSlide().find('.tbk-amount-button').trigger('amount:update');
                    $slider.adaptHeight();
                })
                .on('click keydown', '.tbk-dimmer-off', function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        calendar.find('.tbk-dimmer').removeClass('tbk-active').html('');
                        $slider.adaptHeight();
                    }
                })
                .on('click keydown', '.tbk-pay-button', function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        self.submitPayment($(this));
                    }
                })
                .on('click mousedown', '.tbk-field textarea', function (e) {
                    calendar.css('height', 'auto');
                })
                .parent()
                .on('click keydown', '.tbk-cart .tbk-cart-booking', function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkCheckoutRequest(calendar, self, $(this));
                        return false;
                    }
                })
                .on("click keydown", ".tbk-cart-remove-item", function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        tbkRemoveItemFromCart(calendar, self, $(this));
                    }
                })
            ;
        };

        function validateForm($form) {
            $form.find("input[type!='hidden']:not(.tbk-input-value-confirmation), textarea").each(function () {
                $(this).closest('.tbk-field').removeClass('tbk-error');

                $form.on('input', "input[type!='hidden'], textarea", function () {
                    $(this).closest('.tbk-field').removeClass('tbk-error');
                    $(this).siblings('.tbk-reservation-form-pointing-error').hide(0, function () {
                        $slider.adaptHeight();
                    });
                });
                $form.on('change', "input[type='file'], textarea", function () {
                    $(this).closest('.tbk-field').removeClass('tbk-error');
                    $(this).siblings('.tbk-reservation-form-pointing-error').hide(0, function () {
                        $slider.adaptHeight();
                    });
                });

                if ($(this).prop('required') && !$(this).val() && !$(this).hasClass('tbk-field-skip')) {
                    $(this).closest('.tbk-field').addClass('tbk-error');
                }
                if (typeof $(this).data('validation') !== "undefined" && $(this).val().length > 0) {
                    var regex = new RegExp(tb_base64_decode($(this).data('validation')));
                    if (regex.test($(this).val()) === false) {
                        $(this).siblings('.tbk-reservation-form-pointing-error').eq(0).show();
                        $(this).closest('.tbk-field').addClass('tbk-error');
                    }
                }
                if (!this.checkValidity() && !$(this).hasClass('tbk-field-skip')) {
                    $(this).closest('.tbk-field').addClass('tbk-error');
                }
            });
            // value confirmations
            $form.find("input[type!='hidden'].tbk-input-value-confirmation").each(function () {
                var type = $(this).attr('type');
                var $main_field = $(this).closest('.tbk-field').find("input[type=" + type + "]:not(.tbk-input-value-confirmation)");
                if ($(this).val() !== $main_field.val()) {
                    $(this).siblings('.tbk-reservation-form-pointing-error.tbk-value-confirmation').show();
                    $(this).closest('.tbk-field').addClass('tbk-error');
                }
            });
            $slider.adaptHeight();
            // Select validation
            $form.find(".tbk-dropdown").each(function () {
                $(this).closest('.tbk-field').removeClass('tbk-error');
                if ($(this).find("input").prop('required') && !$(this).find("input").val()) {
                    $(this).closest('.tbk-field').addClass('tbk-error');
                }
            });
            // Checkboxes form validation
            $form.find("input[type='checkbox']").each(function () {
                $(this).closest('.tbk-field').removeClass('tbk-error');
                if ($(this).prop('required') && !$(this).prop("checked")) {
                    $(this).closest('.tbk-field').addClass('tbk-error');
                    $form.on('change keyup', "input[type='checkbox']", function () {
                        $(this).closest('.tbk-field').removeClass('tbk-error');
                    });
                }
            });
            // Check for invalid data
            var valid = true;
            $form.find("input[type!='hidden'], input[type='checkbox'], .tbk-dropdown, textarea").each(function () {
                if ($(this).closest('.tbk-field').hasClass('tbk-error')) {
                    valid = false;
                }
            });
            $form.closest('.tbk-reservation-form-container').find('.tbk-ticket-value').each(function () {
                $(this).closest('td').find('.tbk-tickets-span').removeClass('tbk-error');
                if (!$(this).val()) {
                    $(this).closest('td').find('.tbk-tickets-span').addClass('tbk-error');
                    valid = false;
                }
            });
            return valid;
        }

        this.submitPayment = function ($clicked) {
            if ($clicked.hasClass('tbk-loading')) {
                return;
            }
            $clicked.addClass('tbk-loading');
            var gateway_id = $clicked.data('gateway');
            var offsite = $clicked.data('offsite');
            var reservation_checksum = $clicked.closest('.tbk-pre-payment').data('checksum');
            var reservation_database_id = $clicked.closest('.tbk-pre-payment').data('id');
            var order_id = $clicked.closest('.tbk-pre-payment').data('order');
            var order_redirect_url = $clicked.closest('.tbk-pre-payment').data('order-redirect');
            $.post(
                TB_Ajax.ajax_url,
                {
                    action                 : 'tb_submit_payment',
                    reservation_checksum   : reservation_checksum,
                    gateway_id             : gateway_id,
                    reservation_database_id: reservation_database_id,
                    order                  : order_id,
                    order_redirect         : order_redirect_url
                },
                function (response) {
                    if (offsite == true || response.status == 'redirect') {
                        window.location.href = response.redirect;
                    } else {
                        // parse the dinamically loaded scripts
                        var content = $($.parseHTML(response.content, document, true));
                        // Load the response box
                        $slider.goToSlide($slider.addSlide(content).index()).adaptHeight();
                        $clicked.removeClass('tbk-loading');
                    }
                }, "json"
            );
        };

        this.cancelCheckout = function ($clicked) {
            $clicked.addClass('tbk-loading');
            $.post(
                TB_Ajax.ajax_url,
                {
                    action: 'tbajax_action_checkout_cancel'
                },
                function (response) {
                    self.backToCalendar();
                    $('.tbk-cart').show();
                }
            );
        };

        this.bookNow = function ($clicked) {
            if ($clicked.hasClass('tbk-cart-next-step')) {
                var action_to_call = 'tbajax_action_checkout';
            } else {
                action_to_call = 'tbajax_action_prepare_form';
            }
            var $container = $clicked.closest('.calendar_main_container, .calendar_widget_container');
            var withFiles = $clicked.data('files');
            // Let's get the form id
            var $form = $clicked.closest('.tbk-reservation-form-container').find('.tbk-reservation-form');
            var service_id = $form.find("input[name='service']").val();
            // Let's get the post id
            var post_id = $container.attr('data-postid');
            $form.find("input[name='post_id']").val(post_id);
            // Selected timezone
            var timezone = $container.find('.tbk-timezones .tbk-menu .tbk-menu-item.tbk-selected').data('timezone') || false;
            var coupon = $clicked.closest('.tbk-slide').find('.tbk-summary-coupon-input').val();
            /*
             * Submit, if validation is passed
             */
            if (validateForm($form)) {
                $clicked.addClass('tbk-loading');
                if (withFiles) {
                    // Check for already uploaded files that are ok
                    var uploaded_files = [];
                    $form.find('.tbk-already-uploaded-message').each(function () {
                        uploaded_files.push($(this).attr('data-already-uploaded'));
                    });
                    // File handling is done with FormData objects
                    // It requires the jQuery.ajax method
                    var data = new FormData();
                    // Seems redundant, but we're doing serialize()
                    // so the form listener can be just one
                    data.append('data', $form.serialize());
                    data.append('timezone', timezone);
                    data.append('coupon', coupon);
                    data.append('service_id', service_id);
                    data.append('action', action_to_call);
                    data.append('already_uploaded_ok', uploaded_files);
                    $form.find('input[type="file"]').not('.tbk-field-skip').each(function () {
                        var fileInputName = $(this).attr('name');
                        data.append(fileInputName, this.files[0]);
                    });
                    $.ajax({
                        url        : TB_Ajax.ajax_url,
                        type       : 'POST',
                        data       : data,
                        processData: false,
                        contentType: false,
                        success    : function (response) {
                            if ($clicked.hasClass('tbk-cart-next-step')) {
                                response = response.content;
                                if ($clicked.hasClass('tbk-edit-form-action')) {
                                    $slider.replaceSlide(response);
                                } else {
                                    $slider.goToSlide($slider.addSlide(response).index()).adaptHeight();
                                }
                                self.scrollToTop($clicked);
                                $clicked.removeClass('tbk-loading');
                            } else {
                                if (response.status == 'redirect') {
                                    window.location.href = response.redirect;
                                } else {
                                    // Load the response box
                                    $slider.goToSlide($slider.addSlide(response.content).index()).adaptHeight();
                                    $clicked.removeClass('tbk-loading');
                                    self.scrollToTop($clicked);
                                }
                            }
                        }
                    });
                } else {
                    $.post(
                        TB_Ajax.ajax_url,
                        {
                            action    : action_to_call,
                            data      : $form.serialize(),
                            timezone  : timezone,
                            coupon    : coupon,
                            service_id: service_id
                        },
                        function (response) {
                            if ($clicked.hasClass('tbk-cart-next-step')) {
                                response = response.content;
                                $slider.goToSlide($slider.addSlide(response).index()).adaptHeight();
                                self.scrollToTop($clicked);
                                $clicked.removeClass('tbk-loading');
                            } else {
                                if (response.status == 'redirect') {
                                    window.location.href = response.redirect;
                                } else {
                                    // Load the response box
                                    $slider.goToSlide($slider.addSlide(response.content).index()).adaptHeight();
                                    $clicked.removeClass('tbk-loading');
                                    self.scrollToTop($clicked);
                                }
                            }
                        }, "json"
                    );
                }
            }
        };

        this.scrollToTop = function ($clicked) {
            var $container = $clicked.closest('.calendar_main_container, .calendar_widget_container');
            $('html, body').animate({
                scrollTop: $container.offset().top - 50
            }, 200);
        };

        this.confirmBooking = function ($clicked) {
            $clicked.addClass('tbk-loading');
            var reservation = $clicked.closest('.tbk-reservation-review-container').data('reservation');
            $.post(
                TB_Ajax.ajax_url,
                {
                    action     : 'tbajax_action_submit_form',
                    reservation: reservation
                },
                function (response) {
                    if (response.status == 'redirect') {
                        window.location.href = response.redirect;
                    } else {
                        $slider.goToSlide($slider.addSlide(response.content).index()).adaptHeight();
                        $clicked.removeClass('tbk-loading');
                        self.scrollToTop($clicked);
                    }
                }, "json"
            );
        };

        this.makeAccessible = function (event, handler, params) {
            event.stopPropagation();
            if (event.which == 13 || event.which == 32 || event.which == 1) {
                handler(params);
                return false;
            }
        };

        this.showMonths = function () {
            calendar.find('.tb-fast-selector-year-panel').addClass('lifted');
            calendar.find('.tb-fast-selector-month-panel').toggleClass('lifted');
            calendar.find('.tbk-calendar-month-selector').toggleClass('active');
            calendar.find('.tbk-calendar-year-selector').removeClass('active');
            $slider.adaptHeight();
        };

        this.showYears = function () {
            calendar.find('.tb-fast-selector-month-panel').addClass('lifted');
            calendar.find('.tb-fast-selector-year-panel').toggleClass('lifted');
            calendar.find('.tbk-calendar-year-selector').toggleClass('active');
            calendar.find('.tbk-calendar-month-selector').removeClass('active');
            $slider.adaptHeight();
        };

        this.showSlots = function (content) {
            var $slide = $slider.addSlide(content);
            $slide.find('.tbk-schedule-filters')
                .on('click keydown', '.tbk-schedule-filter-item', function (e) {
                    e.stopPropagation();
                    if (e.which == 13 || e.which == 32 || e.which == 1) {
                        $(this).parent().find('.tbk-schedule-filter-item').removeClass('tbk-selected');
                        $(this).addClass('tbk-selected');
                        var $slot_list = jQuery(this).closest('.tbk-schedule-slots');
                        var identifier = '';
                        var params = {
                            timeint : $slide.find('.tbk-schedule-time-select').find('.tbk-selected').data('value'),
                            address : $slide.find('.tbk-schedule-location-select').find('.tbk-selected').data('value'),
                            coworker: $slide.find('.tbk-schedule-coworker-select').find('.tbk-selected').data('value')
                        };
                        for (var key in params) {
                            if (typeof params[key] === "undefined") continue;
                            if (params.hasOwnProperty(key) && params[key] !== 'all' && params[key].length !== 0 && key !== 'timeint') {
                                identifier += '[data-' + key + '="' + params[key] + '"]';
                            }
                        }
                        $slot_list.find('.tbk-schedule-slot').hide();
                        if (params.timeint !== 'all') {
                            $slot_list.find('.tbk-schedule-slot' + identifier)
                                .filter(function () {
                                    return jQuery(this).attr("data-timeint") >= params.timeint;
                                })
                                .show();
                        } else {
                            $slot_list.find('.tbk-schedule-slot' + identifier).show();
                        }
                        $slider.adaptHeight();
                    }
                });
            $slider.goToSlide($slide.index());
        };

        this.backToCalendar = function () {
            $slider.cleanSlides().goToSlide(0);
        };

        this.backToPrevious = function () {
            var index = $slider.getCurrentSlide().index();
            $slider.getCurrentSlide().remove();
            $slider.goToSlide(index - 1);
        };

        this.get = function () {
            return calendar;
        }

    }

    /*
     * Calendar slider framework
     */
    function tbkSlider($container) {
        var self = this;
        var classes = {
            active  : 'tbk-active',
            inactive: 'tbk-inactive',
            canvas  : 'tbk-slide-canvas',
            slide   : 'tbk-slide'
        };
        var $canvas = $container.find('.' + classes.canvas);
        this.slides = $canvas.find('.' + classes.slide);

        this.init = function () {
            this.slides.addClass(classes.inactive);
            $(this.slides.get(0)).removeClass(classes.inactive).addClass(classes.active);
            $container.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function (e) {
                self.refreshResponsiveness();
                $container.trigger('tbk:slider:adapt');
            });
            $(window).resize(function () {
                self.refreshResponsiveness();
                $container.trigger('tbk:slider:adapt');
            });
            // removing whitespaces
            $canvas.contents().each(function () {
                if (this.nodeType === 3 && !$.trim(this.nodeValue)) {
                    $(this).remove();
                }
            });
            $container.on('tbk:slider:adapt', function () {
                self.adaptHeight();
            });
            self.refreshResponsiveness();
            $container.trigger('tbk:slider:adapt');
        };

        this.countSlides = function () {
            this.slides = $container.find('.' + classes.canvas).find('.' + classes.slide);
            return this.slides.length;
        };

        this.refreshResponsiveness = function () {
            $container.removeClass('tbk-big-container tbk-mid-container tbk-small-container');
            if ($container.width() > 499) {
                $container.addClass('tbk-big-container');
            } else if ($container.width() > 299) {
                $container.addClass('tbk-mid-container');
            } else {
                $container.addClass('tbk-small-container');
            }
        };

        this.adaptHeight = function () {
            if ($container.find('.tbk-dimmer').hasClass('tbk-active')) {
                $container.height($container.find('.tbk-dimmer').height());
            } else {
                $container.height($canvas.find('.' + classes.slide + '.' + classes.active).actual('height'));
            }
        };

        this.goToSlide = function (index) {
            $canvas.attr('class', classes.canvas + ' ' + classes.slide + '-' + index);
            $canvas.find('.' + classes.slide).addClass(classes.inactive).removeClass(classes.active);
            $(this.slides.get(index)).removeClass(classes.inactive).addClass(classes.active);
            this.adaptHeight();
            return this;
        };

        this.addSlide = function (html) {
            var $added = $('<div>');
            $added.addClass(classes.slide + ' ' + classes.inactive).html(html).appendTo($canvas);
            this.countSlides();
            return $added;
        };

        this.replaceSlide = function (html) {
            var $slide = this.getCurrentSlide();
            $slide.html(html);
            this.adaptHeight();
            return $slide;
        };

        this.addToSlide = function (html, index) {
            var $slide = $(this.slides.get(index));
            $slide.html(html);
            this.adaptHeight();
            return $slide;
        };

        this.getCurrentSlide = function () {
            return $canvas.find('.' + classes.slide + '.' + classes.active);
        };

        this.cleanSlides = function () {
            this.slides.slice(1).remove();
            this.countSlides();
            return this;
        };
    }

    $.tbkSliderGet = function ($container) {
        return new tbkSlider($container);
    };

    $(document).click(function () {
        var $menu = $('.tbk-menu');
        if ($menu.parent().hasClass('tbk-setting-button')) {
            $menu.parent().removeClass('tbk-selected');
        }
        $menu.hide();
    });

    tbkLoadInstance = function ($container) {
        var calendar = new tbkCalendar($container.find('.tb-frontend-calendar'));
        calendar.init();
        var $slider = calendar.getSlider();
        calendar.get().parent().on('click keydown', '.tbk-main-calendar-settings .tbk-setting-button', function (e) {
            e.stopPropagation();
            if (e.which != 13 && e.which != 1) {
                return;
            }
            $(this).siblings().removeClass('tbk-selected').find('.tbk-menu').hide();
            $(this).toggleClass('tbk-selected').find('.tbk-menu').toggle();
        });
        calendar.get().parent().on('click', '.tbk-main-calendar-settings .tbk-setting-button:not(.tbk-cart) .tbk-menu-item', function () {
            $(this).closest('.tbk-setting-button').find('.tbk-text').html($(this).html());
        });
        calendar.get().parent().on('click keydown', '.tbk-main-calendar-settings .tbk-setting-button:not(.tbk-cart) .tbk-menu-search', function (e) {
            e.stopPropagation();
        });
        calendar.get().parent().on('keyup', '.tbk-main-calendar-settings .tbk-setting-button:not(.tbk-cart) .tbk-menu-search input', function (e) {
            e.stopPropagation();
            var text = $(this).val().toUpperCase().replace(/[/ ]/g, '');
            $(this).closest('.tbk-menu').find('.tbk-menu-item').each(function () {
                $(this).show();
                if (text.length > 1) {
                    if ($(this).attr('data-timezone').toUpperCase().replace(/[/ ]/g, '').indexOf(text) >= 0) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                }
            });
        });
        /*
         * Fast service/coworker/timezone selectors
         */
        $container.on("click keydown", ".tbk-main-calendar-settings .tbk-setting-button:not(.tbk-cart) .tbk-menu-item", function (e) {
            if (e.which != 13 && e.which != 1) {
                return;
            }
            var upcoming = false;
            var action = 'tbajax_action_filter_calendar';
            if ($container.hasClass('tbk-upcoming')) {
                upcoming = true;
                action = 'tbajax_action_filter_upcoming';
            }
            $(this).addClass('tbk-selected').siblings().removeClass('tbk-selected');
            var calendar = $(this).closest('.calendar_main_container, .calendar_widget_container').find('.tb-frontend-calendar');
            var attr = {
                service  : false,
                services : false,
                coworker : false,
                coworkers: false,
                timezone : false,
                params   : calendar.attr('data-params')
            };
            $(this).closest('.tbk-filters').find('.tbk-menu-item.tbk-selected').each(function () {
                if ($(this).hasClass('tbk-reset-filter')) {
                    if (typeof $(this).attr('data-services') !== 'undefined') {
                        attr.services = $(this).attr('data-services');
                    }
                    if (typeof $(this).attr('data-coworkers') !== 'undefined') {
                        attr.coworkers = $(this).attr('data-coworkers');
                    }
                } else {
                    if (typeof $(this).attr('data-service') !== 'undefined') {
                        attr.service = $(this).attr('data-service');
                    }
                    if (typeof $(this).attr('data-coworker') !== 'undefined') {
                        attr.coworker = $(this).attr('data-coworker');
                    }
                }
            });
            if (typeof $(this).attr('data-timezone') !== 'undefined') {
                attr.timezone = $(this).attr('data-timezone');
            }
            // Let's put the whole calendar container in a loading state
            calendar.addClass('tbk-loading');
            // Let's post the slots for the filtered calendar via Ajax
            $.post(
                TB_Ajax.ajax_url,
                {
                    action   : action,
                    service  : attr.service,
                    services : attr.services,
                    coworker : attr.coworker,
                    coworkers: attr.coworkers,
                    timezone : attr.timezone,
                    params   : attr.params
                },
                function (response) {
                    // Let's replace all with the results (response is a JSON object)
                    var $container = calendar.parent();
                    $container.find('.tbk-cart').show();
                    if (upcoming) {
                        $container.find('.tbk-slide.tbk-active').html(response.upcoming);
                        calendar.removeClass('tbk-loading');
                        calendar.attr('data-params', response.parameters);
                        $slider.adaptHeight();
                        return;
                    }
                    if (response.cart_slots) {
                        $.each(response.cart_slots, function (index, item) {
                            $container.find('.tbk-cart').each(function () {
                                $(this).find('.tbk-menu button[data-item="' + index + '"]').closest('.tbk-menu-item').replaceWith(item.menu_item);
                            });
                        });
                    }
                    $container.find('.tbk-cart.tbk-cart-empty').hide();
                    if (response.unscheduled == false) {
                        $container.find('.tbk-main-calendar-settings').find('.tbk-coworkers, .tbk-timezones').show();
                        $container.find('.tbk-slide.tbk-active').html(response.calendar);
                    } else {
                        $container.find('.tbk-main-calendar-settings').find('.tbk-coworkers, .tbk-timezones').hide();
                        $container.find('.tbk-slide.tbk-active').html(response.calendar);
                    }
                    calendar.removeClass('tbk-loading');
                    calendar.attr('data-params', response.parameters);
                    $slider.adaptHeight();
                }, "json"
            );
        });
    };

    $('.calendar_main_container, .calendar_widget_container').each(function () {
        tbkLoadInstance($(this));
    });

});

(function ($) {

    $.fn.tbkAmountButton = function (options) {
        var settings = $.extend({
            buttonText               : 'Confirm',
            buttonClass              : 'tbk-amount-button',
            toPayNowText             : 'To pay now',
            confirmAndPayText        : 'Confirm and pay',
            currencySymbol           : '$',
            currencyFormat           : 'before',
            defaultAmountTotal       : 0,
            defaultAmountTotalDisc   : 0,
            defaultAmountToPayNow    : 0,
            defaultAmountToPayNowDisc: 0,
            decimals                 : 2,
            amountTotalClass         : '.tbk-amount',
            amountTotalDiscClass     : '.tbk-amount-disc',
            amountToPayNowClass      : '.tbk-amount-to-be-paid',
            amountToPayNowDiscClass  : '.tbk-amount-to-be-paid-disc',
            toPayNowClass            : '.tbk-to-pay-now',
            isCheckout               : false
        }, options);

        var _this = this;
        var is_coupon = false;
        var $slide = this.closest('.tbk-slide');
        var amount_total_disc_prev;

        this.on('coupon:applied', function (event, value) {
            if (settings.isCheckout) {

            } else {
                amount_total_disc_prev = settings.defaultAmountTotalDisc;
                settings.defaultAmountTotalDisc = value;
                _this.trigger('amount:update');
            }
            is_coupon = true;
        });

        this.on('coupon:removed', function () {
            if (settings.isCheckout) {

            } else {
                settings.defaultAmountTotalDisc = amount_total_disc_prev;
                _this.trigger('amount:update');
            }
            is_coupon = false;
        });

        this.changeButtonText = function (text) {
            var $ec = _this.children();
            _this.html(text + ' ').append($ec);
        };

        this.on("click keydown", function (e) {
            e.stopPropagation();
            if (e.which == 13 || e.which == 32 || e.which == 1) {
                if (_this.hasClass('tbk-loading')) return false;
                if (settings.isCheckout) {
                    _this.trigger('tbk:confirm:checkout');
                } else {
                    $slide.find('.tbk-reservation-form').trigger('form:book', [_this]);
                }
                return false;
            }
        });

        this.on('tbk:confirm:checkout', function () {
            var reservations = [];
            $slide.find('tr').each(function () {
                if (typeof $(this).attr('data-reservation') !== "undefined") {
                    reservations.push($(this).attr('data-reservation'));
                }
            });
            if (reservations.length === 0) {
                return false;
            }
            _this.addClass('tbk-loading');
            var inputs = $slide.find('input').serialize();
            var coupon = $slide.find('.tbk-summary-coupon-input').val();
            $.post(
                TB_Ajax.ajax_url,
                {
                    action      : 'tbajax_action_checkout_confirm',
                    inputs      : inputs,
                    tbk_coupon  : coupon,
                    reservations: reservations
                },
                function (response) {
                    if (response.redirect === 'yes') {
                        window.location.href = response.redirect_url;
                    } else {
                        console.log(response.results);
                        var $slider = $.tbkSliderGet($slide.closest('.tb-frontend-calendar'));
                        var content = response.content;
                        $slider.goToSlide($slider.addSlide(content).index()).adaptHeight();
                        $('.tbk-cart').remove();
                        _this.removeClass('tbk-loading');
                    }
                }, "json"
            );
        });

        this.on('amount:update', function () {
            var total_price = 0;
            var total_price_due = 0;
            var total_price_disc = 0;
            var total_price_due_disc = 0;
            if (settings.isCheckout) {
                $slide.find('.tbk-summary-row-unit-price').each(function () {
                    var row = $(this).closest('tr');
                    var unit_price = $(this).data('raw-unit-price');
                    if (row.find('input[type="number"]').length > 0) {
                        var tickets_value = parseInt(row.find('input[type="number"]').val()) || 1;
                        unit_price = unit_price * tickets_value;
                    }
                    if (row.find('.tbk-summary-row-payment').find('.tbk-summary-pay-immediately').length > 0
                        || row.find('.tbk-summary-row-payment').find('input:checkbox:checked').length > 0) {
                        total_price_due = total_price_due + unit_price;
                        total_price_due_disc = total_price_due;
                    }
                    total_price = total_price + unit_price;
                    total_price_disc = total_price;
                });
            } else {
                var $form = $slide.find('form');
                var tickets = parseInt($slide.find('.tbk-ticket-value').val()) || 1;
                var price_inc = 0;
                $form.find('input[type=radio]:checked, .tbk-dropdown .tbk-item.active.selected').each(function () {
                    var inc = parseFloat($(this).data('price-inc'));
                    if (isNaN(inc)) inc = 0;
                    price_inc = price_inc + inc;
                });
                total_price = (settings.defaultAmountTotal + price_inc) * tickets;
                total_price_due = total_price;
                total_price_disc = (settings.defaultAmountTotalDisc + price_inc) * tickets;
                total_price_due_disc = total_price_disc;
            }
            var before = '';
            var after = '';
            if (settings.currencyFormat === 'before') {
                before = settings.currencySymbol;
            } else {
                after = settings.currencySymbol;
            }
            if (total_price === total_price_disc) {
                _this.find(settings.amountToPayNowClass).html(before + total_price_due.toFixed(settings.decimals).toString() + after);
                _this.find(settings.amountTotalClass).html(before + total_price.toFixed(settings.decimals).toString() + after);
            } else {
                _this.find(settings.amountToPayNowClass).html(
                    before
                    + '<del>' + total_price_due.toFixed(settings.decimals).toString() + '</del>'
                    + '<span class="' + settings.amountToPayNowDiscClass.split('.').join('') + '">' + total_price_due_disc.toFixed(settings.decimals).toString() + '</span>'
                    + after
                );
                _this.find(settings.amountTotalClass).html(
                    before
                    + '<del>' + total_price.toFixed(settings.decimals).toString() + '</del>'
                    + '<span class="' + settings.amountTotalDiscClass.split('.').join('') + '">' + total_price_disc.toFixed(settings.decimals).toString() + '</span>'
                    + after
                );
            }

            if (total_price === 0) {
                _this.find(settings.amountTotalClass).hide();
                _this.find(settings.toPayNowClass).hide();
                _this.changeButtonText(settings.buttonText);
            } else if (total_price === total_price_due) {
                _this.find(settings.amountTotalClass).show();
                _this.find(settings.toPayNowClass).hide();
                if (settings.isCheckout) {
                    _this.changeButtonText(settings.confirmAndPayText);
                }
            } else if (total_price_due > 0) {
                _this.find(settings.amountTotalClass).show();
                _this.find(settings.toPayNowClass).show();
                _this.changeButtonText(settings.buttonText);
            } else {
                _this.find(settings.amountTotalClass).show();
                _this.find(settings.toPayNowClass).hide();
                _this.changeButtonText(settings.buttonText);
            }
        });

        this.addClass(settings.buttonClass).trigger('amount:update');

    };

    $.fn.tbkSummaryRowPrice = function (options) {
        var settings = $.extend({
            currencySymbol  : '$',
            currencyFormat  : 'before',
            decimals        : 2,
            unitPrice       : 0,
            incrementedPrice: 0,
            toHideSelector  : '.tbk-payment-info'
        }, options);

        var _this = this;
        var with_coupon = settings.unitPrice;
        var $row = this.closest('tr');
        var increment = settings.incrementedPrice - settings.unitPrice;
        var before = '';
        var after = '';
        if (settings.currencyFormat === 'before') {
            before = settings.currencySymbol;
        } else {
            after = settings.currencySymbol;
        }

        this.on('coupon:applied', function (event, value) {
            with_coupon = value;
            _this.trigger('amount:update');
        });

        this.on('coupon:removed', function () {
            with_coupon = settings.unitPrice;
            _this.trigger('amount:update');
        });

        this.on('amount:update', function () {
            if ($row.find('input[type="number"]').length > 0) {
                var tickets_value = parseInt($row.find('input[type="number"]').val()) || 1;
                var new_price = Math.min(settings.unitPrice + increment, with_coupon + increment) * tickets_value;
            } else {
                new_price = Math.min(settings.unitPrice, with_coupon) + increment;
            }
            _this.html(
                before
                + new_price.toFixed(settings.decimals).toString()
                + after
            );
            _this.data('raw-unit-price', Math.min(settings.unitPrice, with_coupon) + increment);
            if (new_price <= 0) {
                $row.find(settings.toHideSelector).hide();
            } else {
                $row.find(settings.toHideSelector).show();
            }
        });

    };

    $.fn.tbkCouponInput = function (options) {
        var settings = $.extend({
            appliedClass     : '.tbk-summary-coupon-applied',
            inputClass       : '.tbk-summary-coupon-input',
            applyButtonClass : '.tbk-summary-apply-coupon',
            removeButtonClass: '.tbk-summary-remove-coupon',
            applyButtonText  : 'Apply',
            removeButtonText : 'Remove',
            wrongCouponText  : 'Wrong or expired code!',
            isCheckout       : false
        }, options);

        var _this = this;
        var $slide = this.closest('.tbk-slide');
        var $input = this.find(settings.inputClass);
        var default_placeholder = $input.attr('placeholder');

        $input.on('change keydown click', function () {
            $(this).attr('placeholder', default_placeholder);
        });

        this.find(settings.applyButtonClass).html(settings.applyButtonText);

        this.on('click keydown', settings.applyButtonClass, function () {
            var coupon = $input.val();
            if (coupon.length < 1) {
                return false;
            }
            var $button = $(this);
            $button.addClass('tbk-loading');
            $input.prop('disabled', true);
            var slot = $slide.find('input[name="slot"]').val();
            var service_id = $slide.find('input[name="service"]').val();
            var action;
            if (settings.isCheckout) {
                action = 'tbajax_action_validate_coupon_cart';
            } else {
                action = 'tbajax_action_validate_coupon';
            }
            $.post(
                TB_Ajax.ajax_url,
                {
                    action    : action,
                    code      : coupon,
                    slot      : slot,
                    service_id: service_id
                },
                function (response) {
                    if (response.status === 'error') {
                        $input.val('').prop('disabled', false);
                        $input.attr('placeholder', settings.wrongCouponText);
                    } else {
                        $input.hide();
                        _this.find(settings.appliedClass).css('display', 'inline-block').find('span').html(coupon);
                        if (settings.isCheckout) {
                            $.each(response.value, function (index, value) {
                                $slide.find("tr[data-slot-id='" + index + "']").find('.tbk-summary-row-unit-price').trigger('coupon:applied', [value.discounted]);
                            });
                            $slide.find('.tbk-amount-button').trigger('amount:update');
                        } else {
                            $slide.find('.tbk-amount-button').trigger('coupon:applied', [response.value]);
                            $slide.find('.tbk-tickets-price-section').trigger('coupon:applied', [response.value]);
                        }
                        $button
                            .removeClass('tbk-loading ' + settings.applyButtonClass.split('.').join(''))
                            .addClass(settings.removeButtonClass.split('.').join(''))
                            .html(settings.removeButtonText);
                    }
                    $button.removeClass('tbk-loading');
                }, "json"
            );
        });

        this.on('click keydown', settings.removeButtonClass, function () {
            $input.val('').prop('disabled', false);
            var $button = $(this);
            $input.show();
            _this.find(settings.appliedClass).hide().find('span').html('');
            if (settings.isCheckout) {
                $slide.find('.tbk-summary-row-unit-price').trigger('coupon:removed');
                $slide.find('.tbk-amount-button').trigger('amount:update');
            } else {
                $slide.find('.tbk-amount-button').trigger('coupon:removed');
                $slide.find('.tbk-tickets-price-section').trigger('coupon:removed');
            }
            $button
                .removeClass(settings.removeButtonClass.split('.').join(''))
                .addClass(settings.applyButtonClass.split('.').join(''))
                .html(settings.applyButtonText);
        });

        return this;
    };

    $.fn.tbkMaps = function (options) {
        var settings = $.extend({
            mapstyle  : '',
            zoom_level: '',
            address   : ''
        }, options);

        return this.each(function () {
            var _this = $(this);
            var $slider = $(this).closest('.tbk-slide');

            if (typeof google !== 'undefined') {
                var initial_position = false;
                _this.gmap3({
                    getlatlng    : {
                        address : settings.address,
                        callback: function (results) {
                            if (!results) {
                                var map = new google.maps.Map(_this[0]);
                                var service = new google.maps.places.PlacesService(map);
                                var request = {
                                    query: settings.address
                                };
                                service.textSearch(request, function (results, status) {
                                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                                        initial_position = results[0].geometry.location;
                                        settings.address = results[0].formatted_address;
                                        _this.gmap3({
                                            clear : {
                                                id: "tbk-map-directions"
                                            },
                                            map   : {
                                                options: {
                                                    zoom  : settings.zoom_level,
                                                    center: initial_position
                                                }
                                            },
                                            marker: {
                                                address: settings.address,
                                                id     : 'tbk-map-init-address'
                                            }
                                        });
                                    } else {
                                        _this.gmap3('destroy');
                                        _this.html("<div class='tbk-map-address-failed'>The address or place can't be geocoded by Google.</div>");
                                    }
                                });
                            } else {
                                initial_position = results[0].geometry.location;
                            }
                        }
                    },
                    marker       : {
                        address: settings.address,
                        id     : 'tbk-map-init-address'
                    },
                    map          : {
                        options: {
                            zoom             : settings.zoom_level,
                            scrollwheel      : false,
                            mapTypeId        : 'style',
                            mapTypeControl   : false,
                            navigationControl: true
                        }
                    },
                    styledmaptype: {
                        id     : "style",
                        options: {
                            name: "Map"
                        },
                        styles : settings.mapstyle
                    }
                });
                // Intercept the eventual customer address geocoding
                $slider.find('input[id^="tbk-address"]')
                    .on('input', function () {
                        _this.gmap3({
                            clear: {
                                id: "tbk-map-directions"
                            },
                            map  : {
                                options: {
                                    zoom  : settings.zoom_level,
                                    center: initial_position
                                }
                            }
                        });
                    })
                    .on('geocode:result', function (event, result) {
                        _this.gmap3({
                            getroute: {
                                options : {
                                    origin     : result.geometry.location,
                                    destination: settings.address,
                                    travelMode : google.maps.DirectionsTravelMode.DRIVING
                                },
                                callback: function (results) {
                                    if (!results) return;
                                    _this.gmap3({
                                        clear             : {
                                            id: "tbk-map-directions"
                                        },
                                        directionsrenderer: {
                                            options: {
                                                directions: results
                                            },
                                            id     : "tbk-map-directions"
                                        }
                                    });
                                }
                            }
                        });
                    });
            } else {
                _this.html("<div class='tbk-map-missing-library'>Google Maps library not loaded.</div>");
            }
        });
    };

    $.fn.tbkTicketLine = function (options) {
        var settings = $.extend({
            unitPriceClass       : '.tbk-total-price-line-price-unit',
            defaultAmountUnit    : 0,
            defaultAmountUnitDisc: 0,
            currencyFormat       : 'before',
            currencySymbol       : '$',
            decimals             : 2,
            amountUnitDiscClass  : '.tbk-discounted-price',
            inputNumberClass     : '.tbk-ticket-value'
        }, options);

        return this.each(function () {
            var _this = $(this);
            var $slide = _this.closest('.tbk-slide');
            var is_coupon = false;
            var amount_unit_disc_prev;

            _this.on('coupon:applied', function (event, unit_value) {
                amount_unit_disc_prev = settings.defaultAmountUnitDisc;
                settings.defaultAmountUnitDisc = unit_value;
                _this.trigger('tickets:unitprice:update');
                is_coupon = true;
            });

            _this.on('coupon:removed', function () {
                settings.defaultAmountUnitDisc = amount_unit_disc_prev;
                _this.trigger('tickets:unitprice:update');
                is_coupon = false;
            });

            _this.on('keyup', settings.inputNumberClass, function () {
                var x = parseInt($(this).val()) || 1;
                var max = parseInt(this.getAttribute('max'));
                if (x > max) {
                    $(this).val(max);
                }
                $(this).trigger('change');
            });

            _this.on('click change', settings.inputNumberClass, function () {
                $slide.find('.tbk-amount-button').trigger('amount:update');
                var value = parseInt($(this).val()) || 1;
                $(this).closest('.tbk-reservation-form-container').find('form input[name=tickets]').val(value);
            });

            _this.on('tickets:unitprice:update', function () {
                var $form = $slide.find('form');
                var price_inc = 0;
                $form.find('input[type=radio]:checked, .tbk-dropdown .tbk-item.active.selected').each(function () {
                    var inc = parseFloat($(this).data('price-inc'));
                    if (isNaN(inc)) inc = 0;
                    price_inc = price_inc + inc;
                });
                var unit = (settings.defaultAmountUnit + price_inc);
                var unit_disc = (settings.defaultAmountUnitDisc + price_inc);
                var before = '';
                var after = '';
                if (settings.currencyFormat === 'before') {
                    before = settings.currencySymbol;
                } else {
                    after = settings.currencySymbol;
                }
                if (unit === unit_disc) {
                    _this.find(settings.unitPriceClass).html(before + unit.toFixed(settings.decimals).toString() + after);
                } else {
                    _this.find(settings.unitPriceClass).html(
                        before
                        + '<del>' + unit.toFixed(settings.decimals).toString() + '</del>'
                        + '<span class="' + settings.amountUnitDiscClass.split('.').join('') + '">' + unit_disc.toFixed(settings.decimals).toString() + '</span>'
                        + after
                    );
                }
            });

            _this.trigger('tickets:unitprice:update');

        });
    };

})(jQuery);