package com.eneml.ajs.search.api;

import java.util.List;

public interface SearchService {

    List<SearchHit> search(SearchQuery query);
}
