import type { PropertyDef as $PropertyDef } from '@osdk/client';
import { $osdkMetadata } from '../../OntologyMetadata.js';
import type { Station } from './Station.js';
import type { Part } from './Part.js';
import type { ObjectTypeDefinition as $ObjectTypeDefinition, ObjectMetadata as $ObjectMetadata } from '@osdk/client';
import type { ObjectSet as $ObjectSet, Osdk as $Osdk, PropertyValueWireToClient as $PropType, SingleLinkAccessor as $SingleLinkAccessor } from '@osdk/client';
export declare namespace BomLine {
    type PropertyKeys = 'bomLineId' | 'partNumber' | 'program' | 'qtyPerAircraft' | 'stationCode';
    interface Links {
        readonly part: $SingleLinkAccessor<Part>;
        readonly station: $SingleLinkAccessor<Station>;
    }
    interface Props {
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Bom Line Id'
         */
        readonly bomLineId: $PropType['string'];
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Part Number'
         */
        readonly partNumber: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Program'
         */
        readonly program: $PropType['string'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Qty Per Aircraft'
         */
        readonly qtyPerAircraft: $PropType['integer'] | undefined;
        /**
         * @experimental
         *
         *   property status: experimental
         *
         *   display name: 'Station Code'
         */
        readonly stationCode: $PropType['string'] | undefined;
    }
    type StrictProps = Props;
    interface ObjectSet extends $ObjectSet<BomLine, BomLine.ObjectSet> {
    }
    type OsdkInstance<OPTIONS extends never | '$rid' = never, K extends keyof BomLine.Props = keyof BomLine.Props> = $Osdk.Instance<BomLine, OPTIONS, K>;
    /** @deprecated use OsdkInstance */
    type OsdkObject<OPTIONS extends never | '$rid' = never, K extends keyof BomLine.Props = keyof BomLine.Props> = OsdkInstance<OPTIONS, K>;
}
export interface BomLine extends $ObjectTypeDefinition {
    osdkMetadata: typeof $osdkMetadata;
    type: 'object';
    apiName: 'BomLine';
    primaryKeyApiName: 'bomLineId';
    primaryKeyType: 'string';
    __DefinitionMetadata?: {
        objectSet: BomLine.ObjectSet;
        props: BomLine.Props;
        linksType: BomLine.Links;
        strictProps: BomLine.StrictProps;
        apiName: 'BomLine';
        description: '';
        displayName: 'Bom Line';
        icon: {
            type: 'blueprint';
            color: '#4C90F0';
            name: 'cube';
        };
        implements: [];
        interfaceMap: {};
        inverseInterfaceMap: {};
        links: {
            part: $ObjectMetadata.Link<Part, false>;
            station: $ObjectMetadata.Link<Station, false>;
        };
        pluralDisplayName: 'Bom Lines';
        primaryKeyApiName: 'bomLineId';
        primaryKeyType: 'string';
        properties: {
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Bom Line Id'
             */
            bomLineId: $PropertyDef<'string', 'non-nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Part Number'
             */
            partNumber: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Program'
             */
            program: $PropertyDef<'string', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Qty Per Aircraft'
             */
            qtyPerAircraft: $PropertyDef<'integer', 'nullable', 'single'>;
            /**
             * @experimental
             *
             *   property status: experimental
             *
             *   display name: 'Station Code'
             */
            stationCode: $PropertyDef<'string', 'nullable', 'single'>;
        };
        rid: 'ri.ontology.main.object-type.28fa912d-7b95-4862-bfe5-91633f84f17a';
        status: 'EXPERIMENTAL';
        titleProperty: 'bomLineId';
        type: 'object';
        visibility: 'NORMAL';
    };
}
export declare const BomLine: BomLine;
