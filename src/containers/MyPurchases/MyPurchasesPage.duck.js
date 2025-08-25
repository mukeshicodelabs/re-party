import reverse from 'lodash/reverse';
import sortBy from 'lodash/sortBy';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { getAllTransitionsForEveryProcess } from '../../transactions/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { MYPURCHASE, MYRENT, TYPES } from '../../util/types';

const sortedTransactions = txs =>
    reverse(
        sortBy(txs, tx => {
            return tx.attributes ? tx.attributes.lastTransitionedAt : null;
        })
    );

// ================ Action types ================ //

export const FETCH_ORDERS_REQUEST = 'app/InboxPage/FETCH_ORDERS_OR_SALES_REQUEST';
export const FETCH_ORDERS_SUCCESS = 'app/InboxPage/FETCH_ORDERS_OR_SALES_SUCCESS';
export const FETCH_ORDERS_ERROR = 'app/InboxPage/FETCH_ORDERS_OR_SALES_ERROR';

// ================ Reducer ================ //

const entityRefs = entities =>
    entities.map(entity => ({
        id: entity.id,
        type: entity.type,
    }));

const initialState = {
    fetchInProgress: false,
    fetchOrdersError: null,
    pagination: null,
    transactionRefs: [],
};

export default function inboxPageReducer(state = initialState, action = {}) {
    const { type, payload } = action;
    switch (type) {
        case FETCH_ORDERS_REQUEST:
            return { ...state, fetchInProgress: true, fetchOrdersError: null };
        case FETCH_ORDERS_SUCCESS: {
            const transactions = sortedTransactions(payload.data.data);
            return {
                ...state,
                fetchInProgress: false,
                transactionRefs: entityRefs(transactions),
                pagination: payload.data.meta,
            };
        }
        case FETCH_ORDERS_ERROR:
            console.error(payload); // eslint-disable-line
            return { ...state, fetchInProgress: false, fetchOrdersError: payload };

        default:
            return state;
    }
}

// ================ Action creators ================ //

const fetchOrdersRequest = () => ({ type: FETCH_ORDERS_REQUEST });
const fetchOrdersSuccess = response => ({
    type: FETCH_ORDERS_SUCCESS,
    payload: response,
});
const fetchOrdersError = e => ({
    type: FETCH_ORDERS_ERROR,
    error: true,
    payload: e,
});

// ================ Thunks ================ //

const INBOX_PAGE_SIZE = 10;

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
    const state = getState();
    const currentUserId = state.user.currentUser.id.uuid;
    const { tab } = params;

    dispatch(fetchOrdersRequest());

    const { page = 1 } = parse(search);
    const {
        aspectWidth = 1,
        aspectHeight = 1,
        variantPrefix = 'listing-card',
    } = config.layout.listingImage;
    const aspectRatio = aspectHeight / aspectWidth;
    
    // Build API query params based on tab
    const apiQueryParams = {
        only: 'order',
        prot_productType: tab === MYPURCHASE
            ? TYPES.SELL
            : tab === MYRENT
                ? TYPES.RENT
                : null,
        lastTransitions: getAllTransitionsForEveryProcess(),
        include: [
            'listing',
            'author',
            'listing.author',
            'images',
            'author.profileImage',
            'booking',
            "listing.images",
            'provider.profileImage',
            
        ],
        
        // 'fields.transaction': [
        //     'processName',
        //     'lastTransition',
        //     'lastTransitionedAt',
        //     'transitions',
        //     'payinTotal',
        //     'payoutTotal',
        //     'lineItems',
        // ],
        'fields.image': [
            'variants.scaled-small',
            'variants.scaled-medium',
            `variants.${variantPrefix}`,
            `variants.${variantPrefix}-2x`,
            // Avatars
            'variants.square-small',
            'variants.square-small2x',
        ],
        ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
        ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
        'limit.images': 1,
        page,
        perPage: INBOX_PAGE_SIZE,
    };
    
    return sdk.transactions
        .query(apiQueryParams)
        .then(response => {
            dispatch(addMarketplaceEntities(response));
            dispatch(fetchOrdersSuccess(response));
            return response;
        })
        .catch(e => {
            dispatch(fetchOrdersError(storableError(e)));
            throw e;
        });
};
