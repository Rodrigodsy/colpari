<?php
$statuss = wpas_get_post_status();

$ticketCountReport = array();

$second 		  = sanitize_text_field ( isset( $_GET['second'] ) ? $_GET['second'] : 'none' ); 
$search_filter	  =	sanitize_text_field ( isset( $_GET['search_filter'] ) ? $_GET['search_filter'] : ''  ); 
$status_get       = sanitize_text_field ( isset( $_GET['status'] ) ? $_GET['status'] : ''  );
$staff_get        = sanitize_text_field ( isset( $_GET['staff'] ) ? $_GET['staff'] : ''  );
$sDate_get        = sanitize_text_field ( isset( $_GET['sDate'] ) ? $_GET['sDate'] : ''  );
$eDate_get        = sanitize_text_field ( isset( $_GET['eDate'] ) ? $_GET['eDate'] : ''  );
$state_get        = sanitize_text_field ( isset( $_GET['state'] ) ? $_GET['state'] : 'open' );
$chart_type       = sanitize_text_field ( isset( $_GET['type_of_chart'] ) ? $_GET['type_of_chart'] : 'bar' );

$ticket_author    = sanitize_text_field ( isset( $_GET['ticket_author'] ) ? $_GET['ticket_author'] : '' );

$taxonomy_get	 = array();
$cus_fields_get  = array();
$statuses 		 = array();

$statuses = rns_get_filtered_status( $status_get, $statuss );

$query_cust = rns_get_query_string( $_GET );
$taxonomy_get 	= isset( $query_cust[0] ) ? $query_cust[0] : '' ;
$cus_fields_get = isset( $query_cust[1] ) ? $query_cust[1] : '' ;

$result_data = rns_get_resolution_analysis_according_to_chart_type( $second, $statuses, $search_filter, $status_get, $staff_get,  $sDate_get, $eDate_get,  $state_get , $taxonomy_get , $cus_fields_get , $ticket_author  );

$points = $result_data['points'];
$labels = $result_data['labels'];
$colors = $result_data['colors'];

$time_var_disp = "Minutes";

if( rns_check_minutes_value_in_points_array($points,$second) === true ) { // if the minutes are more than limit 
	
	$points = rns_convert_points_data_minutes_to_hour( $points,$second );
	$time_var_disp = "Hours";
	
	if(rns_check_minutes_value_in_points_array($points,$second) === true ) { // if the hours are more than limit 
	
		$points = rns_convert_points_data_hours_to_day( $points,$second );
		$time_var_disp = "Days" ;
	}
}

$time_in = __( $time_var_disp , "reports-and-statistics" );

rns_get_resolution_chart_by_points_label_and_chart_type( $points , $labels , $colors ,  $second , $chart_type , $time_in );

$row_title =  __( "Ticket Close Time " , 'reports-and-statistics' );