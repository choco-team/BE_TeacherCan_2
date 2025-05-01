import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1746094961662 implements MigrationInterface {
    name = 'InitSchema1746094961662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`userId\` int NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`oauthIdHash\` varchar(255) NOT NULL, \`encryptedOauthId\` text NOT NULL, \`ivOauthId\` varchar(255) NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`provider\` enum ('kakao', 'local', 'guest') NOT NULL, \`role\` enum ('user', 'admin', 'guest') NOT NULL DEFAULT 'user', \`encryptedStudentInfo\` text NULL, \`ivStudentInfo\` varchar(255) NOT NULL, \`remainingTokens\` int NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_4ebc049bd0e11e0cc3ce7d476e\` (\`oauthIdHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rsa_key\` (\`id\` int NOT NULL AUTO_INCREMENT, \`publicKey\` text NOT NULL, \`keyVersion\` varchar(50) NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rooms\` (\`id\` varchar(36) NOT NULL, \`roomTitle\` varchar(255) NOT NULL, \`connectedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`students\` (\`id\` int NOT NULL AUTO_INCREMENT, \`roomId\` varchar(255) NOT NULL, \`encryptedName\` varchar(255) NOT NULL, \`ivName\` varchar(255) NOT NULL, \`nameHash\` varchar(255) NOT NULL, \`visitedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_d6a6a00d3de2861f2b7f1bf715\` (\`nameHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`musics\` (\`id\` int NOT NULL AUTO_INCREMENT, \`musicId\` varchar(255) NOT NULL, \`roomId\` varchar(255) NULL, \`studentId\` int NULL, \`nickname\` varchar(255) NULL, \`title\` varchar(255) NULL, \`timeStamp\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_57de40bc620f456c7311aa3a1e6\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD CONSTRAINT \`FK_066c3bff817b1fc2fe699abe983\` FOREIGN KEY (\`roomId\`) REFERENCES \`rooms\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`musics\` ADD CONSTRAINT \`FK_9eaf5a7b66ea455c9cbfa4cd9a7\` FOREIGN KEY (\`studentId\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`musics\` ADD CONSTRAINT \`FK_2a5d8be16df76872877c08699c3\` FOREIGN KEY (\`roomId\`) REFERENCES \`rooms\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`musics\` DROP FOREIGN KEY \`FK_2a5d8be16df76872877c08699c3\``);
        await queryRunner.query(`ALTER TABLE \`musics\` DROP FOREIGN KEY \`FK_9eaf5a7b66ea455c9cbfa4cd9a7\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP FOREIGN KEY \`FK_066c3bff817b1fc2fe699abe983\``);
        await queryRunner.query(`ALTER TABLE \`sessions\` DROP FOREIGN KEY \`FK_57de40bc620f456c7311aa3a1e6\``);
        await queryRunner.query(`DROP TABLE \`musics\``);
        await queryRunner.query(`DROP INDEX \`IDX_d6a6a00d3de2861f2b7f1bf715\` ON \`students\``);
        await queryRunner.query(`DROP TABLE \`students\``);
        await queryRunner.query(`DROP TABLE \`rooms\``);
        await queryRunner.query(`DROP TABLE \`rsa_key\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ebc049bd0e11e0cc3ce7d476e\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`sessions\``);
    }

}
