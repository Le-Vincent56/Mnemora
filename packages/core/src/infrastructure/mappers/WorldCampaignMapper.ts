import { World, WorldProps } from '../../domain/entities/World';
import { Campaign, CampaignProps } from '../../domain/entities/Campaign';
import { EntityID } from '../../domain/value-objects/EntityID';
import { Name } from '../../domain/value-objects/Name';
import { RichText } from '../../domain/value-objects/RichText';
import { Timestamps } from '../../domain/value-objects/Timestamps';

/**
 * Database row type for worlds table.
 */
export interface WorldRow {
    id: string;
    name: string;
    tagline: string | null;
    created_at: string;
    modified_at: string;
}

/**
 * Database row type for campaigns table.
 */
export interface CampaignRow {
    id: string;
    world_id: string;
    name: string;
    description: string | null;
    continuity_id: string | null;
    created_at: string;
    modified_at: string;
}

/**
 * Mapper for World and Campaign entities.
 * Converts between database rows and domain entities.
 */
export class WorldCampaignMapper {
    /**
     * Converts a database row to a World domain entity.
     */
    static worldToDomain(row: WorldRow): World {
        const props: WorldProps = {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            tagline: row.tagline,
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
        };

        return World.fromProps(props);
    }

    /**
     * Converts a World domain entity to a database row.
     */
    static worldToRow(world: World): WorldRow {
        return {
            id: world.id.toString(),
            name: world.name.toString(),
            tagline: world.tagline,
            created_at: world.createdAt.toISOString(),
            modified_at: world.modifiedAt.toISOString(),
        };
    }

    /**
     * Converts a database row to a Campaign domain entity.
     */
    static campaignToDomain(row: CampaignRow): Campaign {
        const props: CampaignProps = {
            id: EntityID.fromStringOrThrow(row.id),
            name: Name.create(row.name).value,
            description: RichText.fromString(row.description ?? ''),
            worldID: EntityID.fromStringOrThrow(row.world_id),
            continuityID: EntityID.fromStringOrThrow(row.continuity_id!),
            timestamps: Timestamps.fromStringsOrThrow(row.created_at, row.modified_at),
        };

        return Campaign.fromProps(props);
    }

    /**
     * Converts a Campaign domain entity to a database row.
     */
    static campaignToRow(campaign: Campaign): CampaignRow {
        return {
            id: campaign.id.toString(),
            world_id: campaign.worldID.toString(),
            name: campaign.name.toString(),
            description: campaign.description.toString() || null,
            continuity_id: campaign.continuityID.toString(),
            created_at: campaign.createdAt.toISOString(),
            modified_at: campaign.modifiedAt.toISOString(),
        };
    }
}