import * as ko from "knockout";
import * as fs from "foursquare";
import {FourSquare} from "./foursquare";
"use strict";

export class ViewModel {

  locations = ko.observableArray([]);
  filteredLocations = ko.observableArray([]);
  filter = ko.observable('Food near Baton Rouge'); // todo move this to the search call and pass directly the first time?
  searchAction = ko.observable('search');
  map: any;
  isListCollapsed = ko.observable(true);
  isCollapsedComputed:KnockoutComputed<any>;
  listPulldownComputed:KnockoutComputed<any>;
  loading = ko.observable(true);
  alerts = ko.observableArray([]);
  fs:FourSquare;

  constructor(map:any) {
    this.map = map;
    // used when a google marker is clicked so the list will collapse
    this.map.setMarkerClickedCallback(() => {
      this.isListCollapsed(true);
    });

    // creating the new FS service
    this.fs = new FourSquare(
        "XJ5MBAGS2GLP1QAXQJWSAVYPKZLRFQK1XNUEE24FHTD2NG1F",
        "I5PXU1HOIGN5ASTP04HAQDB3ZNOTKXJD1GX5GIR1CBHGWIW3");
    this.searchSubmit();

    // apply the required class to the list when it should be shown
    this.isCollapsedComputed = ko.pureComputed(() => {
      return this.isListCollapsed() ? '' : 'list-expanded';
    });

    // change the list pulldown chevron to reflect shown/hidden list
    this.listPulldownComputed = ko.pureComputed(() => {
      if (this.filteredLocations().length == 0) {
        return 'glyphicon-chevron-down';
      }
      return this.isListCollapsed() ? 'glyphicon-chevron-down' : 'glyphicon-chevron-up';
    });
  }

  /**
   * @param resp
   */
  searchCallback = (resp:any) => {
    // set the locations in the google map and the model
    this.map.setLocations(resp.response.venues);
    this.setLocations(resp.response.venues);
    this.setAction('filter');
  };

  /**
   * Displays an error across the map when called
   */
  onError = () => {
    this.addAlert('An error occurred while retrieving venues. Please reload the page and try again.', null);
  };

  /**
   * Submits the current filter criteria to FS as a search query
   */
  searchSubmit = () => {
    console.log(this.filteredLocations().length);
    console.log(this.searchAction());
    if (this.filteredLocations().length > 0 && this.searchAction() === 'filter') {
      this.setCurrentLocation(this.filteredLocations()[0]);
    } else if (this.searchAction() == 'search') {
      this.fs.buildVenuesSearch(this.filter().toLowerCase(), this.map.gMap.getCenter(), this.searchCallback, this.onError);
      this.filter('');
    }
  };

  /**
   * Set the current user action
   * @param action
   */
  setAction = (action:string) => {
    this.searchAction(action);
    if (this.searchAction() == 'filter') {
      this.expandList();
      this.filterLocations();
    } else if (this.searchAction() == 'search') {
      this.collapseList();
      if (this.filter().length > 0) {
        this.searchSubmit();
      }
    }
  };

  toggleListCollapsed = () => {
    this.isListCollapsed(!this.isListCollapsed());
  };

  expandList = () => {
    this.isListCollapsed(false);
  };

  collapseList = () => {
    this.isListCollapsed(true);
  };

  setLocations = (locations:any[]) => {
    this.locations(locations);
    this.setFilteredLocations(locations);
  };

  setFilteredLocations = (locations:any[]) => {
    this.filteredLocations(locations);
  };

  setCurrentLocation = (place:any) => {
    console.log(place);
    this.isListCollapsed(true);
    this.map.triggerMarker(place.marker);
  };

  filterLocations = () => {
    if (this.searchAction() == 'search') {
      return;
    }
    let filtered = this.locations().filter((location: any): boolean => {
      let match = location.name.toLowerCase().indexOf(this.filter().toLowerCase()) > -1;
      if(!match && location.marker) {
        this.map.hideMarker(location.marker);
      } else if (!location.marker.map) {
        this.map.showMarker(location.marker);
      }
      return match;
    });
    this.setFilteredLocations(filtered);
    this.expandList();
  };

  addAlert = (msg:string, type:string) => {
    this.alerts.push({
      msg: msg,
      type: type ? type : 'alert-danger'
    });
  };
}
